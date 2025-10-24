import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const SignUpForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    
    // Business Information
    businessName: '',
    businessAddress: '',
    taxId: '',
    
    // Additional Information
    profileImage: null,
    idPhoto: null,
    businessPermit: null,
    
    // Terms and Verification
    isTermsAccepted: false,
    isEmailVerified: false,
  });

  const [errors, setErrors] = useState({});

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=])[A-Za-z\d!@#$%^&*()_+\-=]{8,}$/;
    return passwordRegex.test(password);
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
  };

  // Image picker function
  const pickImage = async (field) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, [field]: result.assets[0].uri });
    }
  };

  // Validate current step
  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (!validatePassword(formData.password)) 
        newErrors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character';
      if (formData.password !== formData.confirmPassword) 
        newErrors.confirmPassword = 'Passwords do not match';
      if (!validatePhoneNumber(formData.phoneNumber)) 
        newErrors.phoneNumber = 'Invalid phone number format';
    }

    if (step === 2) {
      if (!formData.businessName) newErrors.businessName = 'Business name is required';
      if (!formData.businessAddress) newErrors.businessAddress = 'Business address is required';
      if (!formData.taxId) newErrors.taxId = 'Tax ID is required';
    }

    if (step === 3) {
      if (!formData.profileImage) newErrors.profileImage = 'Profile image is required';
      if (!formData.idPhoto) newErrors.idPhoto = 'ID photo is required';
      if (!formData.businessPermit) newErrors.businessPermit = 'Business permit is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (validateStep()) {
      try {
        // Here you would typically make an API call to register the landlord
        console.log('Form submitted:', formData);
        Alert.alert(
          'Success',
          'Your registration has been submitted for review. We will notify you once your account is verified.',
          [{ text: 'OK', onPress: () => router.push('/landlord') }]
        );
      } catch (error) {
        Alert.alert('Error', 'Something went wrong. Please try again later.');
      }
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      
      <TextInput
        style={[styles.input, errors.firstName && styles.inputError]}
        placeholder="First Name"
        value={formData.firstName}
        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
      />
      {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

      <TextInput
        style={[styles.input, errors.lastName && styles.inputError]}
        placeholder="Last Name"
        value={formData.lastName}
        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
      />
      {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

      <TextInput
        style={[styles.input, errors.email && styles.inputError]}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

      <TextInput
        style={[styles.input, errors.password && styles.inputError]}
        placeholder="Password"
        secureTextEntry
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

      <TextInput
        style={[styles.input, errors.confirmPassword && styles.inputError]}
        placeholder="Confirm Password"
        secureTextEntry
        value={formData.confirmPassword}
        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
      />
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

      <TextInput
        style={[styles.input, errors.phoneNumber && styles.inputError]}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        value={formData.phoneNumber}
        onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
      />
      {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Business Information</Text>
      
      <TextInput
        style={[styles.input, errors.businessName && styles.inputError]}
        placeholder="Business Name"
        value={formData.businessName}
        onChangeText={(text) => setFormData({ ...formData, businessName: text })}
      />
      {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}

      <TextInput
        style={[styles.input, errors.businessAddress && styles.inputError]}
        placeholder="Business Address"
        multiline
        numberOfLines={3}
        value={formData.businessAddress}
        onChangeText={(text) => setFormData({ ...formData, businessAddress: text })}
      />
      {errors.businessAddress && <Text style={styles.errorText}>{errors.businessAddress}</Text>}

      <TextInput
        style={[styles.input, errors.taxId && styles.inputError]}
        placeholder="Tax ID"
        value={formData.taxId}
        onChangeText={(text) => setFormData({ ...formData, taxId: text })}
      />
      {errors.taxId && <Text style={styles.errorText}>{errors.taxId}</Text>}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Document Upload</Text>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => pickImage('profileImage')}
      >
        <MaterialIcons name="add-photo-alternate" size={24} color={Colors.primary} />
        <Text style={styles.uploadButtonText}>Upload Profile Picture</Text>
      </TouchableOpacity>
      {formData.profileImage && (
        <Image source={{ uri: formData.profileImage }} style={styles.uploadedImage} />
      )}
      {errors.profileImage && <Text style={styles.errorText}>{errors.profileImage}</Text>}

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => pickImage('idPhoto')}
      >
        <MaterialIcons name="badge" size={24} color={Colors.primary} />
        <Text style={styles.uploadButtonText}>Upload Valid ID</Text>
      </TouchableOpacity>
      {formData.idPhoto && (
        <Image source={{ uri: formData.idPhoto }} style={styles.uploadedImage} />
      )}
      {errors.idPhoto && <Text style={styles.errorText}>{errors.idPhoto}</Text>}

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => pickImage('businessPermit')}
      >
        <FontAwesome5 name="file-certificate" size={24} color={Colors.primary} />
        <Text style={styles.uploadButtonText}>Upload Business Permit</Text>
      </TouchableOpacity>
      {formData.businessPermit && (
        <Image source={{ uri: formData.businessPermit }} style={styles.uploadedImage} />
      )}
      {errors.businessPermit && <Text style={styles.errorText}>{errors.businessPermit}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((item) => (
            <View
              key={item}
              style={[
                styles.progressDot,
                item <= step ? styles.progressDotActive : null,
              ]}
            />
          ))}
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.buttonTextSecondary}>Previous</Text>
            </TouchableOpacity>
          )}

          {step < 3 ? (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleNextStep}
            >
              <Text style={styles.buttonTextPrimary}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonTextPrimary}>Submit</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  uploadButtonText: {
    marginLeft: 10,
    color: Colors.primary,
    fontSize: 16,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonTextSecondary: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SignUpForm;