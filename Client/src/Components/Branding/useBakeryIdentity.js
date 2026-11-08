import { useAuth } from '../../context/AuthContext';
import { resolveBakeryIdentity } from './resolveBakeryIdentity';

/** The signed-in bakery's identity. No business data source exists yet (see resolveBakeryIdentity.js). */
export default function useBakeryIdentity() {
  const { user } = useAuth();
  return resolveBakeryIdentity({ business: null, user });
}
