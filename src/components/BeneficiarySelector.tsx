import { useTranslation } from 'react-i18next';
import { type Beneficiary } from '../lib/api';

interface Props {
  beneficiaries: Beneficiary[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  label?: string;
  required?: boolean;
}

export default function BeneficiarySelector({ beneficiaries, selected, onSelect, label, required }: Props) {
  const { t } = useTranslation();

  return (
    <label className="beneficiary-selector">
      {label || t('posts.targetBeneficiary')}
      <select
        value={selected || ''}
        onChange={e => onSelect(e.target.value || null)}
        required={required}
      >
        <option value="">{t('posts.generalDonation')}</option>
        {beneficiaries.map(b => (
          <option key={b._id} value={b._id}>{b.name} — {b.organizationName}</option>
        ))}
      </select>
    </label>
  );
}
