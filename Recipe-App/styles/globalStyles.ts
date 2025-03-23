import { StyleSheet } from 'react-native';

export const colors = {
  background: '#FFEEB7',
  text: '#644536',
  navBar: '#FFE682',
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