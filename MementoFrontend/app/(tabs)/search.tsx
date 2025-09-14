import { ContactCard } from '@/components/ContactCard';
import { DesktopLayout } from '@/components/DesktopLayout';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { MementoBorderRadius, MementoColors, MementoFontSizes, MementoSpacing, MementoShadows } from '@/constants/mementoTheme';
import { useFirebaseContacts } from '@/hooks/useFirebaseContacts';
import { Contact } from '@/types/contact';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type SortBy = 'name' | 'company' | 'date' | 'encounters';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'list' | 'grid';

export default function SearchScreen() {
  const { contacts, loading, error } = useFirebaseContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'contacts' | 'search' | 'export'>('search');
  const router = useRouter();

  // Get unique events and tags for filters
  const allEvents = useMemo(() => {
    const events = new Set<string>();
    contacts.forEach(contact => {
      contact.encounters.forEach(encounter => {
        events.add(encounter.event);
      });
    });
    return Array.from(events).sort();
  }, [contacts]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach(contact => {
      contact.tags.forEach(tag => {
        tags.add(tag);
      });
    });
    return Array.from(tags).sort();
  }, [contacts]);

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let filtered = contacts.filter(contact => {
      // Text search
      const matchesSearch = searchQuery === '' || 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.whereFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.whereMet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.funFacts.some(fact => fact.toLowerCase().includes(searchQuery.toLowerCase())) ||
        contact.notes.some(note => note.content.toLowerCase().includes(searchQuery.toLowerCase()));

      // Event filter
      const matchesEvent = selectedEvent === 'all' || 
        contact.encounters.some(encounter => encounter.event === selectedEvent);

      // Tag filter
      const matchesTag = selectedTag === 'all' || 
        contact.tags.includes(selectedTag);

      return matchesSearch && matchesEvent && matchesTag;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
        case 'encounters':
          comparison = a.encounters.length - b.encounters.length;
          break;
        case 'date':
          const aLatest = a.encounters.length > 0 
            ? Math.max(...a.encounters.map(e => new Date(e.date).getTime()))
            : 0;
          const bLatest = b.encounters.length > 0 
            ? Math.max(...b.encounters.map(e => new Date(e.date).getTime()))
            : 0;
          comparison = aLatest - bLatest;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [contacts, searchQuery, selectedEvent, selectedTag, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedEvent('all');
    setSelectedTag('all');
  };

  const hasActiveFilters = searchQuery !== '' || selectedEvent !== 'all' || selectedTag !== 'all';

  const handlePageChange = (page: string) => {
    setCurrentPage(page as any);
    switch (page) {
      case 'dashboard': router.push('/(tabs)/'); break;
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
        title="Search & Browse"
        subtitle="Find and explore your contacts"
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
        title="Search & Browse"
        subtitle="Find and explore your contacts"
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
      title="Search & Browse"
      subtitle="Find and explore your contacts"
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchCard}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <IconSymbol name="magnifyingglass" size={16} color={MementoColors.text.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, company, role, location, fun facts, or notes..."
                placeholderTextColor={MementoColors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity style={styles.voiceButton}>
              <IconSymbol name="mic" size={16} color={MementoColors.text.primary} />
              <Text style={styles.voiceButtonText}>Voice</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters and Controls */}
        <View style={styles.filtersAndControls}>
          {/* Filters */}
          <View style={styles.filtersSection}>
            <View style={styles.filtersHeader}>
              <IconSymbol name="slider.horizontal.3" size={16} color={MementoColors.text.muted} />
              <Text style={styles.filtersText}>Filters:</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
              {/* Event Filter */}
              <View style={styles.filterGroup}>
                <TouchableOpacity
                  style={[styles.filterButton, selectedEvent === 'all' && styles.filterButtonActive]}
                  onPress={() => setSelectedEvent('all')}
                >
                  <IconSymbol name="calendar" size={12} color={selectedEvent === 'all' ? MementoColors.text.white : MementoColors.text.secondary} />
                  <Text style={[styles.filterButtonText, selectedEvent === 'all' && styles.filterButtonTextActive]}>
                    All Events
                  </Text>
                </TouchableOpacity>
                {allEvents.map(event => (
                  <TouchableOpacity
                    key={event}
                    style={[styles.filterButton, selectedEvent === event && styles.filterButtonActive]}
                    onPress={() => setSelectedEvent(event)}
                  >
                    <IconSymbol name="calendar" size={12} color={selectedEvent === event ? MementoColors.text.white : MementoColors.text.secondary} />
                    <Text style={[styles.filterButtonText, selectedEvent === event && styles.filterButtonTextActive]}>
                      {event}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Tag Filter */}
              <View style={styles.filterGroup}>
                <TouchableOpacity
                  style={[styles.filterButton, selectedTag === 'all' && styles.filterButtonActive]}
                  onPress={() => setSelectedTag('all')}
                >
                  <IconSymbol name="tag" size={12} color={selectedTag === 'all' ? MementoColors.text.white : MementoColors.text.secondary} />
                  <Text style={[styles.filterButtonText, selectedTag === 'all' && styles.filterButtonTextActive]}>
                    All Tags
                  </Text>
                </TouchableOpacity>
                {allTags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.filterButton, selectedTag === tag && styles.filterButtonActive]}
                    onPress={() => setSelectedTag(tag)}
                  >
                    <IconSymbol name="tag" size={12} color={selectedTag === tag ? MementoColors.text.white : MementoColors.text.secondary} />
                    <Text style={[styles.filterButtonText, selectedTag === tag && styles.filterButtonTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <IconSymbol name="xmark" size={12} color={MementoColors.text.white} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sort and View Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => {
                const sortOptions: SortBy[] = ['date', 'name', 'company'];
                const currentIndex = sortOptions.indexOf(sortBy);
                const nextIndex = (currentIndex + 1) % sortOptions.length;
                setSortBy(sortOptions[nextIndex]);
              }}
            >
              <Text style={styles.sortButtonText}>
                {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
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
        </View>


        {/* Active Filters Display */}
        {hasActiveFilters && (
          <View style={styles.activeBadgesContainer}>
            {searchQuery && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Search: {searchQuery}</Text>
                <TouchableOpacity 
                  style={styles.badgeRemove}
                  onPress={() => setSearchQuery('')}
                >
                  <IconSymbol name="xmark" size={12} color={MementoColors.text.secondary} />
                </TouchableOpacity>
              </View>
            )}
            {selectedEvent !== 'all' && (
              <View style={styles.activeBadge}>
                <IconSymbol name="calendar" size={12} color={MementoColors.text.secondary} />
                <Text style={styles.activeBadgeText}>{selectedEvent}</Text>
                <TouchableOpacity 
                  style={styles.badgeRemove}
                  onPress={() => setSelectedEvent('all')}
                >
                  <IconSymbol name="xmark" size={12} color={MementoColors.text.secondary} />
                </TouchableOpacity>
              </View>
            )}
            {selectedTag !== 'all' && (
              <View style={styles.activeBadge}>
                <IconSymbol name="tag" size={12} color={MementoColors.text.secondary} />
                <Text style={styles.activeBadgeText}>{selectedTag}</Text>
                <TouchableOpacity 
                  style={styles.badgeRemove}
                  onPress={() => setSelectedTag('all')}
                >
                  <IconSymbol name="xmark" size={12} color={MementoColors.text.secondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Results */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} found
          </Text>
          
          {filteredContacts.length === 0 ? (
            <View style={styles.noResults}>
              <IconSymbol name="magnifyingglass" size={48} color={MementoColors.text.muted} />
              <Text style={styles.noResultsTitle}>No contacts found</Text>
              <Text style={styles.noResultsText}>
                Try adjusting your search terms or filters
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                  <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
              {filteredContacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onPress={() => handleViewContactDetail(contact)}
                  onViewDetail={handleViewContactDetail}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </DesktopLayout>
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
  errorText: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.error,
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: MementoFontSizes.xl,
    fontWeight: '600',
    color: MementoColors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.textSecondary,
  },
  searchCard: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    padding: MementoSpacing.lg,
    marginBottom: MementoSpacing.lg,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    ...MementoShadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MementoSpacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: MementoBorderRadius.md,
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
  },
  searchInput: {
    flex: 1,
    fontSize: MementoFontSizes.md,
    color: MementoColors.text.primary,
    marginLeft: MementoSpacing.sm,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.backgroundSecondary,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    gap: MementoSpacing.xs,
  },
  voiceButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    fontWeight: '500',
  },
  voicePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.textSecondary,
  },
  filtersAndControls: {
    marginBottom: MementoSpacing.lg,
  },
  filtersSection: {
    marginBottom: MementoSpacing.md,
  },
  controlsContainer: {
    marginBottom: 16,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  filtersText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.textSecondary,
  },
  filtersScroll: {
    marginBottom: 12,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.backgroundCard,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    gap: MementoSpacing.xs,
  },
  filterButtonActive: {
    backgroundColor: MementoColors.primary,
    borderColor: MementoColors.primary,
  },
  filterButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: MementoColors.text.white,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    fontSize: MementoFontSizes.sm,
    color: '#FFFFFF',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortControls: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MementoSpacing.md,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.backgroundCard,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    gap: MementoSpacing.xs,
  },
  sortButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    fontWeight: '500',
  },
  sortOrderButton: {
    padding: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.backgroundCard,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
  },
  sortOrderText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.md,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    overflow: 'hidden',
  },
  viewButton: {
    padding: MementoSpacing.sm,
    backgroundColor: MementoColors.backgroundCard,
  },
  viewButtonActive: {
    backgroundColor: MementoColors.backgroundSecondary,
  },
  viewButtonText: {
    fontSize: MementoFontSizes.md,
    color: MementoColors.textPrimary,
  },
  activeBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.backgroundSecondary,
    paddingHorizontal: MementoSpacing.sm,
    paddingVertical: MementoSpacing.xs,
    borderRadius: MementoBorderRadius.sm,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    gap: MementoSpacing.xs,
  },
  activeBadgeText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    fontWeight: '500',
  },
  badgeRemove: {
    padding: 2,
  },
  resultsContainer: {
    marginBottom: 32,
  },
  resultsCount: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.textSecondary,
    marginBottom: 12,
  },
  listContainer: {
    gap: 12,
  },
  gridContainer: {
    gap: 12,
  },
  noResults: {
    backgroundColor: MementoColors.backgroundCard,
    borderRadius: MementoBorderRadius.lg,
    padding: MementoSpacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
    ...MementoShadows.sm,
  },
  noResultsTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: '600',
    color: MementoColors.text.primary,
    marginTop: MementoSpacing.md,
    marginBottom: MementoSpacing.sm,
  },
  noResultsText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.secondary,
    textAlign: 'center',
    marginBottom: MementoSpacing.lg,
  },
  clearFiltersButton: {
    paddingHorizontal: MementoSpacing.lg,
    paddingVertical: MementoSpacing.sm,
    borderRadius: MementoBorderRadius.md,
    backgroundColor: MementoColors.backgroundSecondary,
    borderWidth: 1,
    borderColor: MementoColors.border.medium,
  },
  clearFiltersButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.text.primary,
    fontWeight: '500',
  },
});
