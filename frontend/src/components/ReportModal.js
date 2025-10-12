import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';
import { submitReport } from '../utils/api';

const REPORT_CATEGORIES = [
  { id: 'spam', label: 'Spam', icon: 'ban-outline', description: 'Repetitive or unwanted content' },
  { id: 'inappropriate', label: 'Inappropriate Content', icon: 'warning-outline', description: 'Content that violates community guidelines' },
  { id: 'harassment', label: 'Harassment', icon: 'person-remove-outline', description: 'Bullying, threats, or intimidation' },
  { id: 'hate_speech', label: 'Hate Speech', icon: 'heart-dislike-outline', description: 'Content promoting hatred or discrimination' },
  { id: 'violence', label: 'Violence', icon: 'shield-outline', description: 'Content depicting or promoting violence' },
  { id: 'false_information', label: 'False Information', icon: 'information-circle-outline', description: 'Misleading or factually incorrect content' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', description: 'Other violations not listed above' },
];

const ReportModal = ({ visible, onClose, post, onReportSubmitted }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert('Selection Required', 'Please select a reason for reporting this post.');
      return;
    }

    try {
      setSubmitting(true);
      
      const result = await submitReport(post._id, selectedCategory, description.trim());
      
      if (result.success) {
        Alert.alert(
          'Report Submitted',
          'Thank you for your report. We\'ll review it shortly and take appropriate action.',
          [
            {
              text: 'OK',
              onPress: () => {
                onReportSubmitted && onReportSubmitted();
                handleClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory(null);
    setDescription('');
    setSubmitting(false);
    onClose();
  };

  const selectedCategoryData = REPORT_CATEGORIES.find(cat => cat.id === selectedCategory);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={WINNIPEG_COLORS.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.title}>Report Post</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Post Preview */}
        <View style={styles.postPreview}>
          <Text style={styles.postText} numberOfLines={3}>
            "{post?.text}"
          </Text>
          <Text style={styles.postAuthor}>
            Posted by {post?.author?.displayName || post?.author?.username}
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why are you reporting this post?</Text>
            <Text style={styles.sectionSubtitle}>Select the most appropriate reason:</Text>
            
            {REPORT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && styles.categoryItemSelected
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={selectedCategory === category.id ? WINNIPEG_COLORS.jetsWhite : WINNIPEG_COLORS.jetsBlue}
                  />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={[
                    styles.categoryLabel,
                    selectedCategory === category.id && styles.categoryLabelSelected
                  ]}>
                    {category.label}
                  </Text>
                  <Text style={[
                    styles.categoryDescription,
                    selectedCategory === category.id && styles.categoryDescriptionSelected
                  ]}>
                    {category.description}
                  </Text>
                </View>
                {selectedCategory === category.id && (
                  <Ionicons name="checkmark-circle" size={20} color={WINNIPEG_COLORS.jetsWhite} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
            <Text style={styles.sectionSubtitle}>
              Provide any additional context that might help with our review:
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Describe the issue in more detail..."
              placeholderTextColor={WINNIPEG_COLORS.gray[400]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {description.length}/500 characters
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedCategory || submitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!selectedCategory || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={WINNIPEG_COLORS.jetsWhite} />
            ) : (
              <>
                <Ionicons name="flag-outline" size={20} color={WINNIPEG_COLORS.jetsWhite} />
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WINNIPEG_COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: WINNIPEG_SPACING.lg,
    paddingVertical: WINNIPEG_SPACING.lg,
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderBottomWidth: 1,
    borderBottomColor: WINNIPEG_COLORS.gray[200],
  },
  closeButton: {
    padding: WINNIPEG_SPACING.sm,
  },
  title: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    color: WINNIPEG_COLORS.jetsNavy,
  },
  placeholder: {
    width: 40,
  },
  postPreview: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    padding: WINNIPEG_SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: WINNIPEG_COLORS.gray[200],
  },
  postText: {
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    color: WINNIPEG_COLORS.gray[700],
    lineHeight: 22,
    marginBottom: WINNIPEG_SPACING.sm,
  },
  postAuthor: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[500],
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    paddingHorizontal: WINNIPEG_SPACING.lg,
  },
  section: {
    marginTop: WINNIPEG_SPACING.xl,
  },
  sectionTitle: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    color: WINNIPEG_COLORS.jetsNavy,
    marginBottom: WINNIPEG_SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[600],
    marginBottom: WINNIPEG_SPACING.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    padding: WINNIPEG_SPACING.lg,
    borderRadius: WINNIPEG_RADIUS.lg,
    marginBottom: WINNIPEG_SPACING.md,
    borderWidth: 2,
    borderColor: WINNIPEG_COLORS.gray[200],
    ...WINNIPEG_SHADOWS.sm,
  },
  categoryItemSelected: {
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
    borderColor: WINNIPEG_COLORS.jetsBlue,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WINNIPEG_COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: WINNIPEG_SPACING.md,
  },
  categoryContent: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
    color: WINNIPEG_COLORS.jetsNavy,
    marginBottom: 2,
  },
  categoryLabelSelected: {
    color: WINNIPEG_COLORS.jetsWhite,
  },
  categoryDescription: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[600],
    lineHeight: 18,
  },
  categoryDescriptionSelected: {
    color: WINNIPEG_COLORS.jetsWhite,
    opacity: 0.9,
  },
  textInput: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderWidth: 1,
    borderColor: WINNIPEG_COLORS.gray[300],
    borderRadius: WINNIPEG_RADIUS.lg,
    padding: WINNIPEG_SPACING.lg,
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    color: WINNIPEG_COLORS.gray[700],
    minHeight: 100,
    ...WINNIPEG_SHADOWS.sm,
  },
  characterCount: {
    fontSize: WINNIPEG_TYPOGRAPHY.xs,
    color: WINNIPEG_COLORS.gray[500],
    textAlign: 'right',
    marginTop: WINNIPEG_SPACING.sm,
  },
  footer: {
    padding: WINNIPEG_SPACING.lg,
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderTopWidth: 1,
    borderTopColor: WINNIPEG_COLORS.gray[200],
  },
  submitButton: {
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: WINNIPEG_SPACING.lg,
    borderRadius: WINNIPEG_RADIUS.lg,
    ...WINNIPEG_SHADOWS.md,
  },
  submitButtonDisabled: {
    backgroundColor: WINNIPEG_COLORS.gray[300],
  },
  submitButtonText: {
    color: WINNIPEG_COLORS.jetsWhite,
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    marginLeft: WINNIPEG_SPACING.sm,
  },
});

export default ReportModal;




