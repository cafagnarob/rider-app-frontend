import { useState } from "react"
import { useLoginMutation } from "../features/auth/authApi"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { setCredentials } from "../features/auth/authSlice"

function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [login, { isLoaging, error }] = useLoginMutation()
  const dispach = useDispatch()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const result = await login({ username, password }).unwrap()
      dispach(setCredentials({ token: result.accessToken }))
      navigate("/")
    } catch (err) {
      console.error("login fallito", err)
    }

    return
  }
}
export default LoginPage
