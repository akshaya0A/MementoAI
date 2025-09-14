import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ContactDetail } from '@/components/ContactDetail';
import { Contact } from '@/types/contact';
import { useFirebaseContacts } from '@/hooks/useFirebaseContacts';
import { MementoColors, MementoFontSizes, MementoSpacing, MementoBorderRadius } from '@/constants/mementoTheme';
import { IconSymbol } from '../components/ui/icon-symbol';

export default function ContactDetailScreen() {
  const { contactId } = useLocalSearchParams();
  const router = useRouter();
  const { contacts, updateContact, deleteContact, loading } = useFirebaseContacts();
  
  // Debug logging
  console.log('ContactDetailScreen - contactId:', contactId);
  console.log('ContactDetailScreen - contacts count:', contacts.length);
  console.log('ContactDetailScreen - loading:', loading);
  
  // Find the contact by ID
  const contact = contacts.find(c => c.id === contactId as string);
  
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading contact...</Text>
        </View>
      </View>
    );
  }
  
  if (!contact) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <IconSymbol name="person.circle" size={48} color={MementoColors.text.muted} />
          <Text style={styles.errorTitle}>Contact Not Found</Text>
          <Text style={styles.errorText}>
            The contact with ID "{contactId}" could not be found.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={16} color={MementoColors.text.white} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const handleEdit = (updatedContact: Contact) => {
    updateContact(updatedContact.id, updatedContact);
  };

  const handleDelete = (contactId: string) => {
    deleteContact(contactId);
    router.back();
  };

  return (
    <ContactDetail
      contact={contact}
      onBack={handleBack}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MementoColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: MementoSpacing.lg,
  },
  loadingText: {
    fontSize: MementoFontSizes.lg,
    color: MementoColors.text.primary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: MementoSpacing.lg,
  },
  errorTitle: {
    fontSize: MementoFontSizes.xl,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginTop: MementoSpacing.md,
    marginBottom: MementoSpacing.sm,
  },
  errorText: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.secondary,
    textAlign: 'center',
    marginBottom: MementoSpacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.primary,
    paddingHorizontal: MementoSpacing.lg,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    gap: MementoSpacing.sm,
  },
  backButtonText: {
    color: MementoColors.text.white,
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
  },
});
