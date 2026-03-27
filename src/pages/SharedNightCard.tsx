export default function SharedNightCard() {
  const params = new URLSearchParams(window.location.search);
  const cardId = params.get('nc') || '';
  return (
    <div style={{minHeight:'100vh',background:'#060912',color:'#F4EFE8',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Fraunces',Georgia,serif"}}>
      <div style={{textAlign:'center',padding:24}}>
        <div style={{fontSize:48,marginBottom:16}}>🌙</div>
        <div style={{fontSize:20,fontWeight:600,marginBottom:8}}>Shared Night Card</div>
        <div style={{fontSize:13,color:'rgba(244,239,232,.5)'}}>Card: {cardId || 'loading...'}</div>
      </div>
    </div>
  );
}
