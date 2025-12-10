// Dedicated styles for FavoritesScreen
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FF', // A soft, modern blue-gray
  },
  emptyFavoritesContainer: {
    flex: 1,
    backgroundColor: '#F4F8FF', // Match the main container
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyFavoritesTitle: {
    fontSize: 24, // Make it more prominent
    fontWeight: '700',
    color: '#1E3A8A', // A deeper, more engaging blue
    marginTop: 24,
  },
  emptyFavoritesText: {
    fontSize: 16,
    color: '#475569', // A softer, readable gray-blue
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24, // Improve readability
  },
  favoriteEventCard: {
    height: 110,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 18,
    marginHorizontal: 14,
    overflow: 'hidden',
    elevation: 1,           // less shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  
  favoriteEventImageContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(7, 240, 77, 0.33)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(59, 130, 246, 0.15)',
  },
  favoriteEventImage: {
    width: 100,
    height: 120,
    borderRadius: 8,
    
  },
  favoriteEventPlaceholder: {
    width: 120,
    height: 140,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteEventContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  favoriteEventTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  favoriteEventDate: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  favoriteEventLocation: {
    fontSize: 12,
    color: '#64748b',
  },
  favoriteEventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  favoriteEventPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0277BD',
  },
  favoriteHeartButton: {
    padding: 6,
  },
  // ----- HEADER AND SEARCH STYLES FROM CALENDARSCREEN -----
  header: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    shadowColor: '#0277BD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  curvedHeader: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
    fontWeight: '400',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 100,
    elevation: 5,
  },
});