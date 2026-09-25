import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [pantalla, setPantalla] = useState('consulta')
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alumno, setAlumno] = useState(null)
  const [cuotas, setCuotas] = useState([])

  const consultar = async () => {
    if (dni.length < 7) {
      setError('Ingresá un DNI válido (mínimo 7 dígitos)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: alumnoData, error: errorAlumno } = await supabase
        .from('alumnos')
        .select('*')
        .eq('dni', dni)
        .single()

      if (errorAlumno || !alumnoData) {
        setError('Alumno no encontrado')
        setLoading(false)
        return
      }

      const { data: cuotasData, error: errorCuotas } = await supabase
        .from('cuotas')
        .select('*')
        .eq('alumno_id', alumnoData.id)
        .order('vencimiento', { ascending: true })

      if (errorCuotas) {
        setError('Error al cargar cuotas')
        setLoading(false)
        return
      }

      setAlumno(alumnoData)
      setCuotas(cuotasData || [])
      setPantalla('resultado')
    } catch (err) {
      setError('Error de conexión con la base de datos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const volver = () => {
    setPantalla('consulta')
    setDni('')
    setAlumno(null)
    setCuotas([])
    setError('')
  }

  const saldoPendiente = cuotas
    .filter(c => !c.pagado)
    .reduce((total, c) => total + Number(c.importe), 0)

  const formatImporte = (valor) => {
    return '$' + Number(valor).toLocaleString('es-AR')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: 'Segoe UI, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '375px',
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
      }}>

        {/* HEADER CON LOGO */}
        <div style={{
          background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {pantalla === 'resultado' ? (
            <button
              onClick={volver}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
              }}
            >
              ←
            </button>
          ) : (
            <div style={{ width: '40px' }}></div>
          )}
          
          <div style={{
            flex: 1,
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            MI CUENTA ISPI
          </div>
          
          <div style={{
            width: '45px',
            height: '45px',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px'
          }}>
            <img 
              src="/logo-ispi.png" 
              alt="ISPI Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* PANTALLA 1: CONSULTA */}
        {pantalla === 'consulta' && (
          <div>
            <div style={{ padding: '30px 20px' }}>
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.08)'
              }}>
                <h2 style={{
                  textAlign: 'center',
                  fontSize: '18px',
                  marginBottom: '25px',
                  color: '#333'
                }}>
                  Consulta tu estado de cuenta
                </h2>

                <input
                  type="text"
                  placeholder="Ingrese su DNI"
                  maxLength="8"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '50px',
                    fontSize: '16px',
                    textAlign: 'center',
                    marginBottom: '20px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />

                {error && (
                  <p style={{
                    color: '#f44336',
                    textAlign: 'center',
                    fontSize: '14px',
                    marginBottom: '15px'
                  }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={consultar}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: loading ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {loading ? 'CARGANDO...' : 'CONSULTAR'}
                </button>
              </div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#666',
              fontSize: '14px'
            }}>
              ISPI 4019 - San Juan Bautista
            </div>
          </div>
        )}

        {/* PANTALLA 2: RESULTADO */}
        {pantalla === 'resultado' && alumno && (
          <div>
            <div style={{ padding: '20px' }}>
              <h2 style={{ color: '#212121', fontSize: '24px', marginBottom: '5px' }}>
                Hola, {alumno.nombre} {alumno.apellido}
              </h2>
              <p style={{ color: '#757575', fontSize: '14px', lineHeight: '1.6' }}>
                {alumno.carrera}<br />
                {alumno.curso}° Año
              </p>
            </div>

            <div style={{
              color: '#424242',
              fontSize: '16px',
              fontWeight: '600',
              margin: '20px 20px 15px',
              textTransform: 'uppercase'
            }}>
              ESTADO DE CUENTA
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '0 20px'
            }}>
              {cuotas.map((cuota) => (
                <div
                  key={cuota.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '15px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#212121', fontSize: '14px' }}>
                      {cuota.concepto}
                    </span>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: cuota.pagado ? '#C8E6C9' : '#FFCCBC',
                      color: cuota.pagado ? '#2E7D32' : '#D84315'
                    }}>
                      {cuota.pagado ? '✓' : '$'}
                    </span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#424242' }}>
                    {formatImporte(cuota.importe)}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: cuota.pagado ? '#4CAF50' : '#FF5722'
                  }}>
                    {cuota.pagado ? 'PAGADO' : 'PENDIENTE'}
                  </div>
                </div>
              ))}
            </div>

            {saldoPendiente > 0 && (
              <div style={{
                margin: '25px 20px',
                padding: '25px',
                background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 50%, #FF5722 100%)',
                borderRadius: '15px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(255, 152, 0, 0.4)'
              }}>
                <div style={{
                  color: '#212121',
                  fontSize: '16px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  SALDO PENDIENTE
                </div>
                <div style={{
                  color: '#212121',
                  fontSize: '32px',
                  fontWeight: '700',
                  marginTop: '5px'
                }}>
                  {formatImporte(saldoPendiente)}
                </div>
              </div>
            )}

            <div style={{ padding: '0 20px 30px' }}>
              <button
                onClick={volver}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                VOLVER
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}