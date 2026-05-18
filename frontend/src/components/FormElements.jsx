import React from 'react'

export function FormInput({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required, 
  list,
  className = '',
  ...props 
}) {
  const baseClasses = "w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
  
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      list={list}
      className={`${baseClasses} ${className}`}
      {...props}
    />
  )
}

export function FormTextarea({ 
  value, 
  onChange, 
  placeholder, 
  required, 
  rows = 3,
  className = '',
  ...props 
}) {
  const baseClasses = "w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
  
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={rows}
      className={`${baseClasses} ${className}`}
      {...props}
    />
  )
}

export function FormSelect({ 
  value, 
  onChange, 
  options, 
  className = '',
  ...props 
}) {
  const baseClasses = "w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#4a90d9] focus:shadow-[0_0_0_3px_rgba(74,144,217,0.15)]"
  
  return (
    <select
      value={value}
      onChange={onChange}
      className={`${baseClasses} ${className}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

export function FormButton({ 
  type = 'submit', 
  children, 
  onClick,
  variant = 'primary',
  disabled,
  className = '',
  ...props 
}) {
  const variants = {
    primary: 'bg-[#4a90d9] hover:bg-[#3561b0]',
    danger: 'bg-red-500 hover:bg-red-600',
    secondary: 'bg-gray-500 hover:bg-gray-600',
    success: 'bg-green-600 hover:bg-green-700'
  }
  
  const baseClasses = "px-6 py-3 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
