import { Ionicons } from '@expo/vector-icons';
import { ImagePickerAsset } from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Theme } from '../../constants/theme';
import { createServiceWithImages, updateServiceWithImages } from '../../firebase/artistServices';
import { pickImages } from '../../firebase/storageService';
import { GigInput, GigOption } from '../../models/types';

interface ServiceFormProps {
  artistId: string;
  initialValues?: {
    id: string;
    title: string;
    description: string;
    basePrice: number;
    category: string;
    options: GigOption[];
    images: string[];
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({ 
  artistId, 
  initialValues, 
  onSuccess, 
  onCancel 
}) => {
  // Form state
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [basePrice, setBasePrice] = useState(
    initialValues?.basePrice ? initialValues.basePrice.toString() : ''
  );
  const [category, setCategory] = useState(initialValues?.category || '');
  const [options, setOptions] = useState<GigOption[]>(initialValues?.options || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image handling
  const [selectedImages, setSelectedImages] = useState<ImagePickerAsset[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(initialValues?.images || []);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  // Option form
  const [optionTitle, setOptionTitle] = useState('');
  const [optionDescription, setOptionDescription] = useState('');
  const [optionPrice, setOptionPrice] = useState('');
  
  // Handle image selection
  const handleSelectImages = async () => {
    try {
      const images = await pickImages(true);
      if (images.length > 0) {
        setSelectedImages([...selectedImages, ...images]);
      }
    } catch (error) {
      console.error('Error selecting images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };
  
  // Remove a selected image (not yet uploaded)
  const removeSelectedImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };
  
  // Mark an existing image for deletion
  const markImageForDeletion = (url: string) => {
    setExistingImages(existingImages.filter(img => img !== url));
    setImagesToDelete([...imagesToDelete, url]);
  };
  
  // Add an option
  const addOption = () => {
    if (!optionTitle || !optionDescription || !optionPrice) {
      Alert.alert('Missing Information', 'Please fill in all option fields');
      return;
    }
    
    const newOption: GigOption = {
      id: Math.random().toString(36).substr(2, 9), // Simple ID generation
      title: optionTitle,
      description: optionDescription,
      price: Number(optionPrice)
    };
    
    setOptions([...options, newOption]);
    setOptionTitle('');
    setOptionDescription('');
    setOptionPrice('');
  };
  
  // Remove an option
  const removeOption = (id: string) => {
    setOptions(options.filter(option => option.id !== id));
  };
  
  // Form submission
  const handleSubmit = async () => {
    // Validation
    if (!title || !description || !basePrice || !category) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    
    // Prepare service data
    const serviceData: GigInput = {
      title,
      description,
      basePrice: Number(basePrice),
      category,
      options
    };
    
    setIsSubmitting(true);
    
    try {
      if (initialValues?.id) {
        // Update existing service
        await updateServiceWithImages(
          artistId,
          initialValues.id,
          serviceData,
          selectedImages,
          imagesToDelete
        );
      } else {
        // Create new service
        await createServiceWithImages(
          artistId,
          serviceData,
          selectedImages
        );
      }
      
      setIsSubmitting(false);
      Alert.alert(
        'Success',
        initialValues ? 'Service updated successfully' : 'Service created successfully',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error saving service:', error);
      Alert.alert('Error', 'Failed to save service. Please try again.');
    }
  };
  
  // Render image preview
  const renderImagePreviews = () => {
    return (
      <View style={styles.imagePreviewContainer}>
        {/* Existing images */}
        {existingImages.map((url, index) => (
          <View key={`existing-${index}`} style={styles.imagePreview}>
            <Image source={{ uri: url }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => markImageForDeletion(url)}
            >
              <Ionicons name="close-circle" size={24} color={Theme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        
        {/* New selected images */}
        {selectedImages.map((image, index) => (
          <View key={`new-${index}`} style={styles.imagePreview}>
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeSelectedImage(index)}
            >
              <Ionicons name="close-circle" size={24} color={Theme.colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        
        {/* Add image button */}
        <TouchableOpacity style={styles.addImageButton} onPress={handleSelectImages}>
          <Ionicons name="add" size={40} color={Theme.colors.primary} />
          <Text style={styles.addImageText}>Add Images</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render option list
  const renderOptions = () => {
    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.sectionTitle}>Service Options</Text>
        
        {options.length > 0 ? (
          options.map((option) => (
            <View key={option.id} style={styles.optionItem}>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
                <Text style={styles.optionPrice}>${option.price.toFixed(2)}</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeOptionButton}
                onPress={() => removeOption(option.id)}
              >
                <Ionicons name="trash-outline" size={20} color={Theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noOptionsText}>No options added yet</Text>
        )}
        
        <View style={styles.addOptionForm}>
          <TextInput
            style={styles.input}
            placeholder="Option Title"
            value={optionTitle}
            onChangeText={setOptionTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Option Description"
            value={optionDescription}
            onChangeText={setOptionDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Price"
            keyboardType="decimal-pad"
            value={optionPrice}
            onChangeText={setOptionPrice}
          />
          <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
            <Text style={styles.buttonText}>Add Option</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>{initialValues ? 'Edit Service' : 'Create New Service'}</Text>
        
        {/* Image Section */}
        <Text style={styles.sectionTitle}>Service Images</Text>
        {renderImagePreviews()}
        
        {/* Main Form */}
        <Text style={styles.sectionTitle}>Service Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Service Title"
          value={title}
          onChangeText={setTitle}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Service Description"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Base Price"
          keyboardType="decimal-pad"
          value={basePrice}
          onChangeText={setBasePrice}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Category"
          value={category}
          onChangeText={setCategory}
        />
        
        {/* Options Section */}
        {renderOptions()}
        
        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={onCancel}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {initialValues ? 'Update Service' : 'Create Service'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: Theme.spacing.lg,
  },
  title: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Theme.spacing.md,
  },
  imagePreview: {
    width: 100,
    height: 100,
    margin: 4,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: Theme.borderRadius.sm,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
  },
  addImageButton: {
    width: 100,
    height: 100,
    margin: 4,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: Theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.fontSize.xs,
    marginTop: 5,
  },
  optionsContainer: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: Theme.borderRadius.sm,
    marginBottom: Theme.spacing.sm,
    padding: Theme.spacing.sm,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textDark,
  },
  optionDescription: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text,
  },
  optionPrice: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.primary,
    marginTop: 4,
  },
  removeOptionButton: {
    padding: 10,
  },
  noOptionsText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text,
    fontStyle: 'italic',
    marginBottom: Theme.spacing.md,
  },
  addOptionForm: {
    backgroundColor: '#F9F9F9',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.sm,
  },
  addOptionButton: {
    backgroundColor: Theme.colors.secondary,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.lg,
  },
  submitButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginLeft: Theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  buttonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: '#FFFFFF',
  },
  cancelButtonText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.primary,
  }
});
