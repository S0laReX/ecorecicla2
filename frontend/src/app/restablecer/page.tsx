import {RecoveryForm} from '../../features/auth/components/organisms/RecoveryForm';
import {AuthLayout} from '../../features/auth/components/templates/AuthLayout';
export default function Page(){return <AuthLayout><section className="recovery-content"><h1>Una nueva contraseña</h1><RecoveryForm reset/></section></AuthLayout>;}
