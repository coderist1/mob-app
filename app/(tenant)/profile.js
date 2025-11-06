// app/(tenant)/profile.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Profile() {
  const [userData, setUserData] = React.useState({
    name: 'Jesse Pinkman',
    email: 'jessepinkmanyo@gmail.com',
    phone: '+1 234 567 8900',
    bio: 'Looking for a cozy boarding house near Xavier University. Prefer quiet neighborhoods with good internet connection.',
    type: 'Tenant'
  });

  const [isEditing, setIsEditing] = React.useState(false);

  const handleSaveProfile = () => {
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset any changes here if needed
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={isEditing ? handleCancelEdit : handleEditToggle}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://i.insider.com/5d9f454ee94e865e924818da?width=700' }}
              style={styles.avatar}
            />
            {isEditing && (
              <TouchableOpacity style={styles.cameraButton}>
                <Ionicons name="camera" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.userName}>{userData.name}</Text>
          <Text style={styles.userType}>{userData.type}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={userData.name}
                onChangeText={(text) => setUserData({...userData, name: text})}
                placeholder="Enter your full name"
              />
            ) : (
              <Text style={styles.infoText}>{userData.name}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={userData.email}
                onChangeText={(text) => setUserData({...userData, email: text})}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.infoText}>{userData.email}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={userData.phone}
                onChangeText={(text) => setUserData({...userData, phone: text})}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoText}>{userData.phone}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={userData.bio}
                onChangeText={(text) => setUserData({...userData, bio: text})}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.infoText}>{userData.bio}</Text>
            )}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, {backgroundColor: '#fff0f0'}]}>
                <Ionicons name="lock-closed" size={20} color="#dc2626" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>Change Password</Text>
                <Text style={styles.menuItemDescription}>Update your account password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, {backgroundColor: '#f0f9ff'}]}>
                <Ionicons name="notifications" size={20} color="#0369a1" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>Notification Settings</Text>
                <Text style={styles.menuItemDescription}>Manage your notification preferences</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, {backgroundColor: '#f0fdf4'}]}>
                <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuItemTitle}>Privacy & Security</Text>
                <Text style={styles.menuItemDescription}>Control your privacy settings</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Save Button when editing */}
        {isEditing && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 30,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userType: {
    fontSize: 16,
    color: '#667eea',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#667eea',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});