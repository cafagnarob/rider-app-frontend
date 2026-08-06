import { useState } from "react"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import { COLORS, styles } from "../styles/theme"

function PasswordInput({ value, onChange, placeholder, style, ...rest }) {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ position: "relative" }}>
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...styles.input, paddingRight: 46, ...style }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Nascondi password" : "Mostra password"}
        style={{
          position: "absolute",
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: COLORS.textMuted,
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
        }}
      >
        {visible ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
      </button>
    </div>
  )
}

export default PasswordInput
