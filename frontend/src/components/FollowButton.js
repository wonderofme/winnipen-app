import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';

const FollowButton = ({ 
  isFollowing, 
  onFollowChange, 
  disabled = false,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const [loading, setLoading] = useState(false);
  const [optimisticFollowing, setOptimisticFollowing] = useState(isFollowing);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Update optimistic state when prop changes
  React.useEffect(() => {
    setOptimisticFollowing(isFollowing);
  }, [isFollowing]);

  const handlePress = async () => {
    if (loading || disabled) return;
    
    // Optimistic update - immediately change UI
    const newFollowingState = !optimisticFollowing;
    setOptimisticFollowing(newFollowingState);
    
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setLoading(true);
    
    try {
      await onFollowChange(newFollowingState);
    } catch (error) {
      console.error('Follow button error:', error);
      // Rollback optimistic update on error
      setOptimisticFollowing(!newFollowingState);
      
      // Show error animation
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button];
    
    if (size === 'small') {
      baseStyle.push(styles.buttonSmall);
    } else if (size === 'large') {
      baseStyle.push(styles.buttonLarge);
    } else {
      baseStyle.push(styles.buttonMedium);
    }

    if (optimisticFollowing) {
      baseStyle.push(styles.buttonFollowing);
    } else {
      baseStyle.push(styles.buttonFollow);
    }

    if (disabled || loading) {
      baseStyle.push(styles.buttonDisabled);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];
    
    if (size === 'small') {
      baseStyle.push(styles.buttonTextSmall);
    } else if (size === 'large') {
      baseStyle.push(styles.buttonTextLarge);
    } else {
      baseStyle.push(styles.buttonTextMedium);
    }

    if (optimisticFollowing) {
      baseStyle.push(styles.buttonTextFollowing);
    } else {
      baseStyle.push(styles.buttonTextFollow);
    }

    return baseStyle;
  };

  const getIconName = () => {
    if (loading) return null;
    return optimisticFollowing ? 'checkmark' : 'person-add';
  };

  const getButtonText = () => {
    if (loading) return 'Loading...';
    return optimisticFollowing ? 'Following' : 'Follow';
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={optimisticFollowing ? WINNIPEG_COLORS.jetsWhite : WINNIPEG_COLORS.jetsBlue} 
          />
        ) : (
          <>
            {getIconName() && (
              <Ionicons 
                name={getIconName()} 
                size={size === 'small' ? 16 : size === 'large' ? 20 : 18} 
                color={optimisticFollowing ? WINNIPEG_COLORS.jetsWhite : WINNIPEG_COLORS.jetsBlue}
                style={styles.icon}
              />
            )}
            <Text style={getTextStyle()}>
              {getButtonText()}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: WINNIPEG_RADIUS.lg,
    ...WINNIPEG_SHADOWS.sm,
  },
  buttonSmall: {
    paddingHorizontal: WINNIPEG_SPACING.md,
    paddingVertical: WINNIPEG_SPACING.sm,
    minWidth: 80,
  },
  buttonMedium: {
    paddingHorizontal: WINNIPEG_SPACING.lg,
    paddingVertical: WINNIPEG_SPACING.md,
    minWidth: 100,
  },
  buttonLarge: {
    paddingHorizontal: WINNIPEG_SPACING.xl,
    paddingVertical: WINNIPEG_SPACING.lg,
    minWidth: 120,
  },
  buttonFollow: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderWidth: 2,
    borderColor: WINNIPEG_COLORS.jetsBlue,
  },
  buttonFollowing: {
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
    borderWidth: 2,
    borderColor: WINNIPEG_COLORS.jetsBlue,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    textAlign: 'center',
  },
  buttonTextSmall: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
  },
  buttonTextMedium: {
    fontSize: WINNIPEG_TYPOGRAPHY.base,
  },
  buttonTextLarge: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
  },
  buttonTextFollow: {
    color: WINNIPEG_COLORS.jetsBlue,
  },
  buttonTextFollowing: {
    color: WINNIPEG_COLORS.jetsWhite,
  },
  icon: {
    marginRight: WINNIPEG_SPACING.xs,
  },
});

export default FollowButton;
