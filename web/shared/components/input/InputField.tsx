import { Input } from '~/components/ui/input';

interface InputFieldProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
  disabled: boolean;
}

export function InputField({ 
  value, 
  onChange, 
  onKeyDown, 
  placeholder, 
  disabled 
}: InputFieldProps) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className="flex-1"
    />
  );
}