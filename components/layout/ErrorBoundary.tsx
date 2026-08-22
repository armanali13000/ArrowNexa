import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PrimaryButton } from '../ui/Button';
import { Text } from '../ui/Text';
import { getUiText } from '../../services/i18n/appCopy';
import { useSettingsStore } from '../../store/settings/settingsStore';

type Props = {
  children: React.ReactNode;
};

type State = {
  failed: boolean;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const language = useSettingsStore.getState().language;
    const t = (text: string) => getUiText(language, text);
    return (
      <View style={styles.screen}>
        <Text variant="heading2" align="center">{t('Something went wrong')}</Text>
        <Text variant="body" align="center">{t('ArrowNexa recovered from an unexpected screen error.')}</Text>
        <PrimaryButton title={t('Try Again')} onPress={() => this.setState({ failed: false })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: '#FCFBF8',
  },
});
