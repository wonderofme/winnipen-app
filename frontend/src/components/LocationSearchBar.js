import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchLocation, formatLocationName, getLocationDescription } from '../utils/locationSearch';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';

const LocationSearchBar = ({ onSelectLocation, onClose, placeholder = "Search for places in Winnipeg..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search function
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
      setError(null);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      
      const searchResults = await searchLocation(searchQuery);
      setResults(searchResults);
      setShowResults(searchResults.length > 0);
    } catch (err) {
      setError(err.message);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (location) => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setError(null);
    Keyboard.dismiss();
    
    if (onSelectLocation) {
      onSelectLocation(location);
    }
    
    if (onClose) {
      onClose();
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setError(null);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const renderResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectLocation(item)}
    >
      <View style={styles.resultIcon}>
        <Ionicons 
          name="location-outline" 
          size={20} 
          color={WINNIPEG_COLORS.jetsBlue} 
        />
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultName} numberOfLines={1}>
          {formatLocationName(item)}
        </Text>
        <Text style={styles.resultDescription} numberOfLines={1}>
          {getLocationDescription(item)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyResults = () => (
    <View style={styles.emptyResults}>
      <Ionicons name="search-outline" size={24} color={WINNIPEG_COLORS.gray[400]} />
      <Text style={styles.emptyText}>
        {query.trim().length < 3 ? 'Type at least 3 characters to search' : 'No results found'}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorResults}>
      <Ionicons name="alert-circle-outline" size={24} color={WINNIPEG_COLORS.error} />
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={WINNIPEG_COLORS.gray[400]} 
            style={styles.searchIcon}
          />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={WINNIPEG_COLORS.gray[400]}
            value={query}
            onChangeText={setQuery}
            onFocus={handleInputFocus}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={WINNIPEG_COLORS.gray[400]} />
            </TouchableOpacity>
          )}
          {loading && (
            <ActivityIndicator 
              size="small" 
              color={WINNIPEG_COLORS.jetsBlue} 
              style={styles.loadingIndicator}
            />
          )}
        </View>
      </View>

      {showResults && (
        <View style={styles.resultsContainer}>
          {error ? (
            renderError()
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderResultItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            renderEmptyResults()
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100, // Position below the banner
    left: 0,
    right: 0,
    zIndex: 1001,
    backgroundColor: 'rgba(255, 0, 0, 0.1)', // Temporary debug background
  },
  searchBar: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderRadius: WINNIPEG_RADIUS.lg,
    marginHorizontal: WINNIPEG_SPACING.lg,
    marginTop: WINNIPEG_SPACING.sm,
    marginBottom: WINNIPEG_SPACING.md,
    ...WINNIPEG_SHADOWS.lg,
    borderWidth: 1,
    borderColor: WINNIPEG_COLORS.gray[200],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: WINNIPEG_SPACING.md,
    paddingVertical: WINNIPEG_SPACING.sm,
  },
  searchIcon: {
    marginRight: WINNIPEG_SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    color: WINNIPEG_COLORS.jetsNavy,
    paddingVertical: WINNIPEG_SPACING.xs,
  },
  clearButton: {
    padding: WINNIPEG_SPACING.xs,
    marginLeft: WINNIPEG_SPACING.sm,
  },
  loadingIndicator: {
    marginLeft: WINNIPEG_SPACING.sm,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: WINNIPEG_SPACING.lg,
    right: WINNIPEG_SPACING.lg,
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderRadius: WINNIPEG_RADIUS.lg,
    maxHeight: 200,
    ...WINNIPEG_SHADOWS.lg,
    borderWidth: 1,
    borderColor: WINNIPEG_COLORS.gray[200],
  },
  resultsList: {
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: WINNIPEG_SPACING.md,
    paddingVertical: WINNIPEG_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: WINNIPEG_COLORS.gray[100],
  },
  resultIcon: {
    marginRight: WINNIPEG_SPACING.md,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
    color: WINNIPEG_COLORS.jetsNavy,
    marginBottom: 2,
  },
  resultDescription: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[600],
  },
  emptyResults: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: WINNIPEG_SPACING.xl,
    paddingHorizontal: WINNIPEG_SPACING.lg,
  },
  emptyText: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[500],
    marginLeft: WINNIPEG_SPACING.sm,
    textAlign: 'center',
  },
  errorResults: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: WINNIPEG_SPACING.xl,
    paddingHorizontal: WINNIPEG_SPACING.lg,
  },
  errorText: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.error,
    marginLeft: WINNIPEG_SPACING.sm,
    textAlign: 'center',
  },
});

export default LocationSearchBar;
