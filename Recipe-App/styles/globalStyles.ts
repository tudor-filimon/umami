import { StyleSheet } from 'react-native';

export const colors = {
  background: '#FFFFFF',
  text: '#000000',
  navBar: '#F5F5F5',
  primary: '#007AFF',
  primaryLight: '#E6F2FF',
  secondary: '#F0F0F0',
  textSecondary: '#666666',
  border: '#E0E0E0',
  white: '#FFFFFF',
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.text,
  },
  headerText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  navBar: {
    backgroundColor: colors.navBar,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    color: colors.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.navBar,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
}); 