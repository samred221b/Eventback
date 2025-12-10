import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const eventScreenStyles = StyleSheet.create({
  // Event Screen
  eventListContainer: {
    paddingHorizontal: 20,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  eventDetails: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventMetaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  viewDetailsButton: {
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewDetailsButtonText: {
    color: '#0277BD',
    fontWeight: '600',
  },
});

export default eventScreenStyles;
