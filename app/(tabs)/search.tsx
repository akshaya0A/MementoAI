import { ContactCard } from '@/components/ContactCard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MementoColors, MementoFontSizes } from '@/constants/mementoTheme';
import { mockContacts } from '@/data/sampleContacts';
import { Contact } from '@/types/contact';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SortBy = 'name' | 'company' | 'date' | 'encounters';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'list' | 'grid';

export default function SearchScreen() {
  const [contacts] = useState<Contact[]>(mockContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Search & Browse</Text>
          <Text style={styles.subtitle}>Find and explore your contacts</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchCard}>
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={20} color={MementoColors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, company, role, location, fun facts, or notes..."
              placeholderTextColor={MementoColors.text.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.voiceButton}>
              <IconSymbol name="mic" size={16} color={MementoColors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters and Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.filtersHeader}>
            <IconSymbol name="slider.horizontal.3" size={16} color={MementoColors.text.secondary} />
            <Text style={styles.filtersText}>Filters:</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {/* Event Filter */}
            <View style={styles.filterGroup}>
              <TouchableOpacity
                style={[styles.filterButton, selectedEvent === 'all' && styles.filterButtonActive]}
                onPress={() => setSelectedEvent('all')}
              >
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
                  <Text style={[styles.filterButtonText, selectedTag === tag && styles.filterButtonTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <IconSymbol name="xmark" size={12} color="white" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sort and View Controls */}
        <View style={styles.controlsRow}>
          <View style={styles.sortControls}>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => {
                const sortOptions: SortBy[] = ['date', 'name', 'company', 'encounters'];
                const currentIndex = sortOptions.indexOf(sortBy);
                const nextIndex = (currentIndex + 1) % sortOptions.length;
                setSortBy(sortOptions[nextIndex]);
              }}
            >
              <IconSymbol name="arrow.up.arrow.down" size={16} color={MementoColors.text.secondary} />
              <Text style={styles.sortButtonText}>
                Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </Text>
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
              <Text style={styles.sortOrderText}>{sortOrder.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <IconSymbol name="list.bullet" size={16} color={MementoColors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <IconSymbol name="square.grid.2x2" size={16} color={MementoColors.text.secondary} />
            </TouchableOpacity>
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
                  onPress={() => console.log('Contact pressed:', contact.name)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MementoColors.background,
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MementoColors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: MementoFontSizes.md,
    color: MementoColors.textPrimary,
  },
  voiceButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: MementoColors.tagBackground,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  filterButtonActive: {
    backgroundColor: MementoColors.primary,
    borderColor: MementoColors.primary,
  },
  filterButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.textPrimary,
  },
  filterButtonTextActive: {
    color: 'white',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: MementoColors.border.light,
    gap: 4,
  },
  sortButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.textPrimary,
  },
  sortOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: MementoColors.border.light,
    gap: 2,
  },
  sortOrderText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.textPrimary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  viewButton: {
    padding: 8,
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: MementoColors.secondary,
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
    backgroundColor: MementoColors.tagBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  activeBadgeText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.textPrimary,
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noResultsTitle: {
    fontSize: MementoFontSizes.lg,
    fontWeight: '600',
    color: MementoColors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: MementoColors.border.light,
  },
  clearFiltersButtonText: {
    fontSize: MementoFontSizes.sm,
    color: MementoColors.textPrimary,
  },
});
