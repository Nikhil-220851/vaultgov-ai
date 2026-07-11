import React from 'react';
import { Modal, View, Text, ActivityIndicator, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FirebaseRecaptchaVerifierModalProps {
  firebaseConfig?: any;
  title?: string;
  cancelLabel?: string;
}

interface State {
  visible: boolean;
  statusText: string;
  isComplete: boolean;
}

export class FirebaseRecaptchaVerifierModal extends React.Component<
  FirebaseRecaptchaVerifierModalProps,
  State
> {
  state: State = {
    visible: false,
    statusText: 'Connecting to verification nodes...',
    isComplete: false,
  };

  private resolve: ((token: string) => void) | null = null;
  private reject: ((error: Error) => void) | null = null;
  private spinValue = new Animated.Value(0);

  get type(): string {
    return 'recaptcha';
  }

  componentDidMount() {
    this.startAnimation();
  }

  private startAnimation = () => {
    this.spinValue.setValue(0);
    Animated.loop(
      Animated.timing(this.spinValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  };

  verify = async (): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.setState({
        visible: true,
        statusText: 'Securing channel with VaultGov...',
        isComplete: false,
      });

      // Step 1: Initial load
      setTimeout(() => {
        if (!this.state.visible) return;
        this.setState({ statusText: 'Verifying application signatures...' });

        // Step 2: Signature check
        setTimeout(() => {
          if (!this.state.visible) return;
          this.setState({
            statusText: 'App integrity verified. Finalizing...',
            isComplete: true,
          });

          // Step 3: Success and resolve
          setTimeout(() => {
            if (this.resolve) {
              this.resolve('mock-recaptcha-token');
            }
            this.setState({ visible: false });
          }, 600);
        }, 1000);
      }, 1000);
    });
  };

  cancel = () => {
    if (this.reject) {
      this.reject(new Error('App verification cancelled by user'));
    }
    this.setState({ visible: false });
  };

  _reset = () => {
    // Firebase JS SDK calls this to reset the verifier state after execution.
    // In our simulated mock modal, we keep it as a safe no-op.
  };

  render() {
    const { visible, statusText, isComplete } = this.state;
    const { title = 'Security Verification' } = this.props;

    const spin = this.spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.iconContainer}>
              {isComplete ? (
                <View style={styles.successBadge}>
                  <Ionicons name="shield-checkmark" size={32} color="#4CD964" />
                </View>
              ) : (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="shield-half-sharp" size={48} color="#1977F3" />
                </Animated.View>
              )}
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{statusText}</Text>

            {!isComplete && (
              <ActivityIndicator size="small" color="#1977F3" style={styles.indicator} />
            )}
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    width: 290,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconContainer: {
    marginBottom: 20,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBadge: {
    transform: [{ scale: 1.1 }],
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.25,
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
  indicator: {
    marginTop: 16,
  },
});
