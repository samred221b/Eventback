import { StyleSheet } from 'react-native';

const organizerLoginStyles = StyleSheet.create({
  // Modern Organizer Login
  modernOrganizerContainer: {
    flex: 1,
    backgroundColor: '#F4F8FF',
  },
  modernOrganizerHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  modernOrganizerHeaderIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modernOrganizerHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modernOrganizerHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  modernOrganizerFormCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
  },
  modernOrganizerFormTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  modernOrganizerError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modernOrganizerErrorText: {
    marginLeft: 8,
    color: '#EF4444',
    fontWeight: '500',
  },
  modernOrganizerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modernOrganizerSuccessText: {
    marginLeft: 8,
    color: '#10B981',
    fontWeight: '500',
  },
  modernOrganizerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  modernOrganizerInputIconContainer: {
    paddingRight: 8,
  },
  modernOrganizerInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1F2937',
  },
  modernOrganizerInputFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0277BD',
    borderWidth: 1,
  },
  modernOrganizerEyeIcon: {
    padding: 8,
  },
  modernOrganizerForgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  modernOrganizerForgotText: {
    color: '#0277BD',
    fontWeight: '600',
  },
  modernOrganizerPrimaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modernOrganizerPrimaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  modernOrganizerPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  modernOrganizerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  modernOrganizerDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  modernOrganizerDividerText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  modernOrganizerSocialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  modernOrganizerSocialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernOrganizerToggleButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  modernOrganizerToggleText: {
    color: '#6B7280',
  },
  modernOrganizerToggleTextBold: {
    fontWeight: '700',
    color: '#0277BD',
  },
  modernOrganizerFeaturesSection: {
    padding: 20,
  },
  modernOrganizerFeaturesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modernOrganizerFeatureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  modernOrganizerFeatureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(2, 119, 189, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modernOrganizerFeatureContent: {
    flex: 1,
  },
  modernOrganizerFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modernOrganizerFeatureDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  forgotPasswordOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotPasswordModal: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  forgotPasswordHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotPasswordTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  forgotPasswordSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  forgotPasswordForm: {},
  simpleInputGroup: {
    marginBottom: 16,
  },
  simpleInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  simpleInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  simpleButton: {
    backgroundColor: '#0277BD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  simpleButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  simpleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  simpleToggle: {
    marginTop: 16,
    alignItems: 'center',
  },
  simpleToggleText: {
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default organizerLoginStyles;
