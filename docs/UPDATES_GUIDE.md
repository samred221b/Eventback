# Eventopia OTA Updates Guide

This guide explains how to use Expo Updates to push instant UI changes to users without app store review.

## What You Can Update Instantly

✅ **You CAN update:**
- UI components and styling
- Text content and labels
- Bug fixes in JavaScript code
- New features that don't require native code
- Configuration changes
- Navigation flow improvements

❌ **You CANNOT update:**
- Native modules (camera, GPS, etc.)
- App permissions
- App icons or splash screens
- Bundle identifier or package name
- iOS/Android-specific native code

## How Updates Work

1. **Development**: Make your changes to the code
2. **Publish**: Push updates to Expo servers
3. **Delivery**: Users get update prompt on next app launch
4. **Installation**: Update installs automatically and app restarts

## Publishing Updates

### Method 1: Using the Script (Recommended)

```bash
# Quick publish with default message
./scripts/publish-update.sh

# Publish with custom message
./scripts/publish-update.sh "Fixed event creation bug"
```

### Method 2: Manual Expo Command

```bash
# Publish to production channel
expo publish --release-channel production

# Publish with message
expo publish --message "UI improvements" --release-channel production
```

### Method 3: Using Expo CLI Interactive

```bash
expo publish
# Follow the prompts
```

## Update Channels

- **production**: Live app users (default)
- **preview**: Testing before production
- **development**: Development builds

## Best Practices

### Before Publishing
1. ✅ Test your changes thoroughly
2. ✅ Check for breaking changes
3. ✅ Verify API compatibility
4. ✅ Test on both iOS and Android

### Update Messages
Keep messages clear and concise:
- ✅ "Fixed event creation crash"
- ✅ "Improved event loading speed"
- ✅ "Updated event card design"
- ❌ "bug fix"
- ❌ "update"

### Rollback Strategy
If something goes wrong:
1. Publish the previous working version
2. Users will get the rollback on next launch
3. Monitor error reports

## Monitoring Updates

### Expo Dashboard
- Visit [expo.dev](https://expo.dev)
- Check your project's update history
- Monitor adoption rates

### In-App
- Users see update prompt automatically
- Check logs for update success/failure
- Monitor crash reports after update

## Troubleshooting

### Update Not Showing
- Check if users are on the right channel
- Verify runtime version compatibility
- Check network connectivity

### Update Failed
- Check Expo dashboard for errors
- Verify bundle size limits
- Check for syntax errors

### Users Can't Update
- Ensure they have internet connection
- Check if they're on a very old version
- Verify app store version compatibility

## Emergency Updates

For critical bugs:
1. Fix the issue immediately
2. Publish with "Critical fix" message
3. Monitor adoption closely
4. Be ready to rollback if needed

## Version Compatibility

Updates work across minor version changes:
- ✅ 1.0.0 → 1.0.1
- ✅ 1.0.0 → 1.1.0
- ❌ 1.0.0 → 2.0.0 (requires app store update)

## Security Considerations

- Updates are signed and verified
- Users can opt out of automatic updates
- Sensitive data should remain server-side
- Test authentication flows after updates

## Example Workflow

```bash
# 1. Make your changes
git checkout -b fix-event-crash
# ... edit files ...
git add .
git commit -m "Fixed event creation crash"

# 2. Test locally
expo start
# Test the fix thoroughly

# 3. Publish update
./scripts/publish-update.sh "Fixed event creation crash"

# 4. Monitor
# Check Expo dashboard for adoption
# Monitor error reports
# Wait for user feedback
```

## Support

If you encounter issues:
1. Check [Expo Updates documentation](https://docs.expo.dev/build-reference/updates/)
2. Review Expo dashboard for errors
3. Check your app's update configuration
4. Test with a development build first
