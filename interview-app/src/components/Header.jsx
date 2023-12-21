import Logo from '../assets/full-logo.png'

const Header = () => {
  return (
    <div style={{position: 'fixed', top: '0', left: '0', width: '100%', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '0 30px'}}>
        <div style={{height: '100%'}}>
        <img src={Logo} alt='logo' width='180px' />
        </div>
        <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <span style={{
  display: "inline-block",
  padding: "5px 10px",
  borderRadius: "10px",
  backgroundColor: "#ffcc00",
  color: "#333333",
  fontWeight: "bold",
  fontSize: "14px",
  boxShadow: "2px 2px 4px rgba(0,0,0,0.1)"
}}>Test version</span>

        </div>
    </div>
  )
}

export default Header