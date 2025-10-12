import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { APP_CONFIG } from '../utils/config';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';

const CreatePostModal = ({ visible, onClose, onSubmit, location }) => {
  const [text, setText] = useState('');
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImagePicker = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll access to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Images only
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMediaUri(asset.uri);
        setMediaType('image'); // Always image
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMediaUri(asset.uri);
        setMediaType('image'); // Always image
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadMedia = async () => {
    if (!mediaUri) return null;

    try {
      setUploading(true);

      // Upload to Cloudinary
      const result = await uploadImageToCloudinary(mediaUri, {
        folder: 'winnipen/posts',
        quality: 'auto',
        fetch_format: 'auto',
        width: 1200,
        height: 1200,
        crop: 'limit'
      });

      if (result.success) {
        return result.url;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && !mediaUri) {
      Alert.alert('Error', 'Please add some text or media to your post');
      return;
    }

    if (text.length > APP_CONFIG.maxPostLength) {
      Alert.alert('Error', `Text must be less than ${APP_CONFIG.maxPostLength} characters`);
      return;
    }

    try {
      setSubmitting(true);
      
      let mediaUrl = null;
      if (mediaUri) {
        mediaUrl = await uploadMedia();
      }

      await onSubmit({
        text: text.trim(),
        mediaUrl,
        mediaType: mediaUrl ? 'image' : null, // Only set mediaType if there's media
      });

      // Reset form
      setText('');
      setMediaUri(null);
      setMediaType(null);
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const removeMedia = () => {
    setMediaUri(null);
    setMediaType(null);
  };

  const formatLocation = () => {
    if (!location) return 'Unknown location';
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Post</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitButton, (!text.trim() && !mediaUri) && styles.submitButtonDisabled]}
            disabled={submitting || uploading || (!text.trim() && !mediaUri)}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color={WINNIPEG_COLORS.jetsGold} />
            <Text style={styles.locationText}>{formatLocation()}</Text>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="What's happening in Winnipeg?"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={APP_CONFIG.maxPostLength}
            textAlignVertical="top"
          />

          <Text style={styles.characterCount}>
            {text.length}/{APP_CONFIG.maxPostLength}
          </Text>

          {mediaUri && (
            <View style={styles.mediaContainer}>
              <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
              <TouchableOpacity style={styles.removeMediaButton} onPress={removeMedia}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleImagePicker}
              disabled={uploading}
            >
              <Ionicons name="image" size={24} color={WINNIPEG_COLORS.jetsGold} />
              <Text style={styles.mediaButtonText}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaButton}
              onPress={handleCamera}
              disabled={uploading}
            >
              <Ionicons name="camera" size={24} color={WINNIPEG_COLORS.jetsGold} />
              <Text style={styles.mediaButtonText}>Take Photo</Text>
            </TouchableOpacity>
          </View>

          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.uploadingText}>Uploading image...</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: WINNIPEG_SPACING.xl,
    paddingVertical: WINNIPEG_SPACING.lg,
    backgroundColor: WINNIPEG_COLORS.jetsNavy,
    borderBottomWidth: 1,
    borderBottomColor: WINNIPEG_COLORS.gray[200],
  },
  cancelButton: {
    padding: WINNIPEG_SPACING.sm,
  },
  cancelText: {
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    color: WINNIPEG_COLORS.jetsWhite,
  },
  title: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    color: WINNIPEG_COLORS.jetsWhite,
  },
  submitButton: {
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
    paddingHorizontal: WINNIPEG_SPACING.xl,
    paddingVertical: WINNIPEG_SPACING.sm,
    borderRadius: WINNIPEG_RADIUS['2xl'],
  },
  submitButtonDisabled: {
    backgroundColor: WINNIPEG_COLORS.gray[400],
  },
  submitText: {
    color: WINNIPEG_COLORS.jetsWhite,
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
  },
  content: {
    flex: 1,
    padding: WINNIPEG_SPACING.xl,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: WINNIPEG_SPACING.lg,
    padding: WINNIPEG_SPACING.sm,
    backgroundColor: WINNIPEG_COLORS.prairieBeige,
    borderRadius: WINNIPEG_RADIUS.md,
  },
  locationText: {
    marginLeft: WINNIPEG_SPACING.sm,
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[600],
  },
  textInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 20,
  },
  mediaContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  mediaButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    minWidth: 100,
  },
  mediaButtonText: {
    marginTop: 5,
    fontSize: 14,
    color: '#374151',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  uploadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default CreatePostModal;
