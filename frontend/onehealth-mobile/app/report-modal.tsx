import { View } from 'react-native';
import { router } from 'expo-router';
import ReportFlow from '@/components/flows/ReportFlow';
import { incrementReportCount, setFirstReportComplete } from '@/utils/storage';

export default function ReportModal() {
  return (
    <View style={{ flex: 1 }}>
      <ReportFlow
        onClose={() => {
          router.back();
        }}
        onSignUp={() => {
          router.replace({ pathname: '/auth-modal', params: { mode: 'signup' } });
        }}
        onReportSubmitted={async () => {
          await incrementReportCount();
          await setFirstReportComplete();
        }}
        onReturnHome={() => {
          router.back();
        }}
      />
    </View>
  );
}
