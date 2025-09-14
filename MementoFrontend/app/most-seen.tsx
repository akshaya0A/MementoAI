import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ContactCard } from '../components/ContactCard';
import { DesktopLayout } from '../components/DesktopLayout';
import { IconSymbol } from '../components/ui/icon-symbol';
import { MementoColors, MementoFontSizes, MementoSpacing, MementoBorderRadius } from '../constants/mementoTheme';
import { useFirebaseContacts } from '../hooks/useFirebaseContacts';
import { Contact } from '../types/contact';

type SortBy = 'name' | 'encounters' | 'date';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

export default function MostSeenScreen() {
  const { contacts, loading, error } = useFirebaseContacts();
  const [sortBy, setSortBy] = useState<SortBy>('encounters');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'contacts' | 'search' | 'export'>('dashboard');
  const router = useRouter();

  // Get most seen contacts (sorted by encounter count)
  const mostSeenContacts = useMemo(() => {
    return [...contacts]
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'encounters':
            comparison = a.encounters.length - b.encounters.length;
            break;
          case 'date':
            const aLatest = Math.max(...a.encounters.map(e => new Date(e.date).getTime()));
            const bLatest = Math.max(...b.encounters.map(e => new Date(e.date).getTime()));
            comparison = aLatest - bLatest;
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [contacts, sortBy, sortOrder]);

  const handlePageChange = (page: string) => {
    setCurrentPage(page as any);
    switch (page) {
      case 'dashboard': router.push('/'); break;
      case 'contacts': router.push('/(tabs)/contacts'); break;
      case 'search': router.push('/(tabs)/search'); break;
      case 'export': router.push('/(tabs)/export'); break;
    }
  };

  const handleViewContactDetail = (contact: Contact) => {
    router.push(`/contact-detail?contactId=${contact.id}`);
  };

  // Show loading state
  if (loading) {
    return (
      <DesktopLayout
        currentPage={currentPage}
        onPageChange={handlePageChange}
        title="Most Seen Contacts"
        subtitle="Contacts you've met most frequently"
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      </DesktopLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DesktopLayout
        currentPage={currentPage}
        onPageChange={handlePageChange}
        title="Most Seen Contacts"
        subtitle="Contacts you've met most frequently"
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout
      currentPage={currentPage}
      onPageChange={handlePageChange}
      title="Most Seen Contacts"
      subtitle={`${mostSeenContacts.length} contacts sorted by encounter frequency`}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sort and View Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.sortControls}>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => {
                const sortOptions: SortBy[] = ['encounters', 'name', 'date'];
                const currentIndex = sortOptions.indexOf(sortBy);
                const nextIndex = (currentIndex + 1) % sortOptions.length;
                setSortBy(sortOptions[nextIndex]);
              }}
            >
              <Text style={styles.sortButtonText}>
                {sortBy === 'encounters' ? 'Encounters' : 
                 sortBy === 'name' ? 'Name' : 'Date'}
              </Text>
              <IconSymbol name="arrow.up.arrow.down" size={16} color={MementoColors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortOrderButton}
              onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <IconSymbol 
                name={sortOrder === 'asc' ? "chevron.up" : "chevron.down"} 
                size={16} 
                color={MementoColors.text.secondary} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <IconSymbol name="square.grid.2x2" size={16} color={MementoColors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <IconSymbol name="list.bullet" size={16} color={MementoColors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          {mostSeenContacts.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="eye" size={48} color={MementoColors.text.muted} />
              <Text style={styles.emptyStateTitle}>No contacts yet</Text>
              <Text style={styles.emptyStateText}>
                Start building your network by adding contacts
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultsCount}>
                {mostSeenContacts.length} contact{mostSeenContacts.length !== 1 ? 's' : ''} found
              </Text>
              <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
                {mostSeenContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onPress={() => console.log('Contact pressed:', contact.name)}
                    onViewDetail={handleViewContactDetail}
                    showEncounterCount={true}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </DesktopLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
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
  errorText: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.error,
    textAlign: 'center',
    marginBottom: MementoSpacing.md,
  },
  retryButton: {
    backgroundColor: MementoColors.primary,
    paddingHorizontal: MementoSpacing.lg,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
  },
  retryButtonText: {
    color: MementoColors.text.white,
    fontSize: MementoFontSizes.md,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: MementoSpacing.md,
    backgroundColor: MementoColors.background,
    borderBottomWidth: 1,
    borderBottomColor: MementoColors.border.light,
  },
  sortControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.sm,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.borderMedium,
    gap: MementoSpacing.xs,
  },
  sortButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    fontWeight: '500',
  },
  sortOrderButton: {
    padding: MementoSpacing.sm,
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.borderMedium,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.borderMedium,
    overflow: 'hidden',
  },
  viewButton: {
    padding: MementoSpacing.sm,
    backgroundColor: MementoColors.backgroundSecondary,
  },
  viewButtonActive: {
    backgroundColor: MementoColors.primary + '20',
  },
  resultsContainer: {
    padding: MementoSpacing.md,
  },
  resultsCount: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    marginBottom: MementoSpacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: MementoSpacing.md,
  },
  listContainer: {
    gap: MementoSpacing.sm,
  },
  emptyState: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    padding: MementoSpacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MementoColors.borderMedium,
  },
  emptyStateTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginTop: MementoSpacing.md,
    marginBottom: MementoSpacing.sm,
  },
  emptyStateText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    textAlign: 'center',
  },
});
