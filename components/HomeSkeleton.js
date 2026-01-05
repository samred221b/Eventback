import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.headerSkeleton}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarSkeleton} />
          <View style={styles.headerTextSkeleton}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, { width: '60%' }]} />
          </View>
        </View>
        <View style={styles.headerButtons}>
          <View style={styles.iconSkeleton} />
          <View style={styles.iconSkeleton} />
        </View>
      </View>

      {/* Search skeleton */}
      <View style={styles.searchSkeleton} />

      {/* Banners skeleton */}
      <View style={styles.bannerSkeleton} />

      {/* Trending Events skeleton */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleSkeleton} />
        <View style={styles.seeAllSkeleton} />
      </View>
      <View style={styles.trendingSkeleton}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.trendingCardSkeleton}>
            <View style={styles.trendingImageSkeleton} />
            <View style={styles.trendingContentSkeleton}>
              <View style={styles.skeletonLine} />
              <View style={styles.skeletonLine} />
              <View style={styles.skeletonLine} />
            </View>
          </View>
        ))}
      </View>

      {/* Featured Events skeleton */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleSkeleton} />
        <View style={styles.seeAllSkeleton} />
      </View>
      <View style={styles.featuredSkeleton}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.featuredCardSkeleton}>
            <View style={styles.featuredImageSkeleton} />
            <View style={styles.featuredContentSkeleton}>
              <View style={styles.skeletonLine} />
              <View style={styles.skeletonLine} />
              <View style={styles.skeletonLine} />
            </View>
          </View>
        ))}
      </View>

      {/* Stats skeleton */}
      <View style={styles.statsSkeleton}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statCardSkeleton} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  headerTextSkeleton: {
    gap: 4,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    marginBottom: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  searchSkeleton: {
    height: 48,
    backgroundColor: '#E2E8F0',
    borderRadius: 24,
    marginBottom: 20,
  },
  bannerSkeleton: {
    height: 160,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleSkeleton: {
    height: 20,
    width: 120,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
  },
  seeAllSkeleton: {
    height: 16,
    width: 60,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  trendingSkeleton: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  trendingCardSkeleton: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendingImageSkeleton: {
    height: 120,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 12,
  },
  trendingContentSkeleton: {
    gap: 6,
  },
  featuredSkeleton: {
    gap: 16,
    marginBottom: 32,
  },
  featuredCardSkeleton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  featuredImageSkeleton: {
    width: 100,
    height: 100,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
  },
  featuredContentSkeleton: {
    flex: 1,
    gap: 6,
  },
  statsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCardSkeleton: {
    width: '30%',
    height: 100,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
  },
});
