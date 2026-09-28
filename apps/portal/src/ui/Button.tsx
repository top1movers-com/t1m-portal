import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cx } from './cx'
import { Icon, type IconName } from './Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'touch'

interface ButtonLookProps {
  /** Keep one primary per view. Defaults to secondary. */
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  /** Render only the icon; children become the visually hidden accessible label. */
  iconOnly?: boolean
}

function buttonClass({ variant = 'secondary', size, iconOnly }: ButtonLookProps, extra?: string, loading?: boolean) {
  return cx(
    'ds-btn',
    `ds-btn--${variant}`,
    size && `ds-btn--${size}`,
    iconOnly && 'ds-btn--icon',
    loading && 'ds-btn--loading',
    extra,
  )
}

function content(icon: IconName | undefined, iconOnly: boolean | undefined, children: ReactNode) {
  return (
    <>
      {icon && <Icon name={icon} />}
      {iconOnly ? <span className="ds-vh">{children}</span> : children}
    </>
  )
}

export interface ButtonProps extends ButtonLookProps, Omit<ComponentPropsWithRef<'button'>, 'children'> {
  children: ReactNode
  /** Shows the in-button spinner, swaps the label, and disables the button. */
  loading?: boolean
  loadingLabel?: string
}

export function Button({
  variant,
  size,
  icon,
  iconOnly,
  loading,
  loadingLabel = 'Saving…',
  className,
  children,
  type = 'button',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, iconOnly }, className, loading)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      title={iconOnly && typeof children === 'string' ? children : rest.title}
      {...rest}
    >
      {loading ? loadingLabel : content(icon, iconOnly, children)}
    </button>
  )
}

export interface LinkButtonProps extends ButtonLookProps, Omit<LinkProps, 'children'> {
  children: ReactNode
}

/** A router link that looks like a button. Use for navigation, never for actions. */
export function LinkButton({ variant, size, icon, iconOnly, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonClass({ variant, size, iconOnly }, cx(className))} {...rest}>
      {content(icon, iconOnly, children)}
    </Link>
  )
}
