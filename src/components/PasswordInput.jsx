import { useState } from "react"
import { FaEye, FaEyeSlash } from "react-icons/fa"

function PasswordInput({ value, onChange, placeholder, className, ...rest }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-input-wrap">
      <input
        type={visible ? "text" : "password"}
        className={`input ${className || ""}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...rest}
      />
      <button
        type="button"
        className="password-input-wrap__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Nascondi password" : "Mostra password"}
      >
        {visible ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
      </button>
    </div>
  )
}

export default PasswordInput
