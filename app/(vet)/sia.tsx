import { Redirect } from 'expo-router';
import { useVetDesktop } from '../../components/vet/desktop/useVetDesktop';
import { VetSiaDesktop } from '../../components/vet/desktop/VetSiaDesktop';

/** SIA em tela cheia (desktop). No mobile, mantém o assistente atual. */
export default function VetSiaScreen() {
  const desktop = useVetDesktop();
  if (!desktop) return <Redirect href="/(tutor)/assistente" />;
  return <VetSiaDesktop />;
}