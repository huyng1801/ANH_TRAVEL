// src/components/ui/Input.tsx
import React from 'react';
import classNames from 'classnames';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  status?: 'default' | 'success' | 'error';
  label?: string;
  supportText?: string;
  labelClassName?: string;
}

let inputIdCounter = 0;

const Input = ({
  status = 'default',
  label,
  supportText,
  className,
  labelClassName,
  id,
  ...props
}: InputProps) => {
  const [inputId, setInputId] = React.useState<string>(id || '');

  React.useEffect(() => {
    if (!id && !inputId) {
      inputIdCounter++;
      setInputId(`input-${inputIdCounter}`);
    }
  }, [id, inputId]);

  const finalId = id || inputId;

  return (
    <div className="relative w-full">
      <input
        id={finalId}
        placeholder=" " // bắt buộc phải có để label hoạt động đúng
        className={classNames(
          'input peer placeholder-transparent',
          {
            'input-default': status === 'default',
            'input-success': status === 'success',
            'input-error': status === 'error',
          },
          className
        )}
        {...props}
      />

      {label && finalId && (
        <label htmlFor={finalId} className={classNames("floating-label", labelClassName)}>
          {label}
        </label>
      )}

      {supportText && (
        <p
          className={classNames('text-xs mt-1', {
            'text-gray-500': status === 'default',
            'text-[var(--success)]': status === 'success',
            'text-[var(--error)]': status === 'error',
          })}
        >
          {supportText}
        </p>
      )}
    </div>
  );
};

export default Input;