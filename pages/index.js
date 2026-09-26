import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [pantalla, setPantalla] = useState('consulta')
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [alumno, setAlumno] = useState(null)
  const [cuotas, setCuotas] = useState([])
  const [descargando, setDescargando] = useState(false)
  const [autoSearch, setAutoSearch] = useState(false)

  const consultar = async (dniBuscado) => {
    const dniFinal = dniBuscado || dni
    if (dniFinal.length < 7) {
      setError('Ingresá un DNI válido (mínimo 7 dígitos)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: alumnoData, error: errorAlumno } = await supabase
        .from('alumnos')
        .select('*')
        .eq('dni', dniFinal)
        .single()

      if (errorAlumno || !alumnoData) {
        setError('No encontramos alumnos con ese DNI')
        setLoading(false)
        return
      }

      const { data: cuotasData, error: errorCuotas } = await supabase
        .from('cuotas')
        .select('*')
        .eq('alumno_id', alumnoData.id)
        .order('vencimiento', { ascending: true })

      if (errorCuotas) {
        setError('Error al cargar las cuotas')
        setLoading(false)
        return
      }

      setAlumno(alumnoData)
      setCuotas(cuotasData || [])
      setPantalla('resultado')
    } catch (err) {
      setError('Error de conexión. Intentá nuevamente.')
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

  const totalCuotas = cuotas.length
  const cuotasPagadas = cuotas.filter(c => c.pagado).length
  const cuotasPendientes = totalCuotas - cuotasPagadas
  const saldoPendiente = cuotas
    .filter(c => !c.pagado)
    .reduce((total, c) => total + Number(c.importe), 0)

  const formatImporte = (valor) => {
    return '$' + Number(valor).toLocaleString('es-AR', { minimumFractionDigits: 2 })
  }

  const formatDate = (fecha) => {
    if (!fecha) return '-'
    const date = new Date(fecha)
    return date.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const descargarComprobante = () => {
    setDescargando(true)
    
    let contenido = `═══════════════════════════════════════════════════\n`
    contenido += `        ISPI Nro 4019 "San Juan Bautista"\n`
    contenido += `           Estado de Cuenta Alumno\n`
    contenido += `═══════════════════════════════════════════════════\n\n`
    contenido += `Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}\n\n`
    contenido += `───────────────────────────────────────────────────\n`
    contenido += `DATOS DEL ALUMNO\n`
    contenido += `───────────────────────────────────────────────────\n`
    contenido += `Apellido y Nombre: ${alumno.apellido}, ${alumno.nombre}\n`
    contenido += `DNI: ${alumno.dni}\n`
    contenido += `Carrera: ${alumno.carrera}\n`
    contenido += `Año: ${alumno.curso}°\n\n`
    contenido += `───────────────────────────────────────────────────\n`
    contenido += `DETALLE DE CUOTAS\n`
    contenido += `───────────────────────────────────────────────────\n\n`
    
    cuotas.forEach((cuota, index) => {
      contenido += `${String(index + 1).padStart(2, '0')}. ${cuota.concepto}\n`
      contenido += `   Importe: ${formatImporte(cuota.importe)}\n`
      contenido += `   Vencimiento: ${formatDate(cuota.vencimiento)}\n`
      contenido += `   Estado: ${cuota.pagado ? 'PAGADO' : 'PENDIENTE'}\n`
      if (cuota.pagado && cuota.fecha_pago) {
        contenido += `   Fecha de pago: ${formatDate(cuota.fecha_pago)}\n`
      }
      contenido += `\n`
    })
    
    contenido += `───────────────────────────────────────────────────\n`
    contenido += `RESUMEN\n`
    contenido += `───────────────────────────────────────────────────\n`
    contenido += `Total de cuotas: ${totalCuotas}\n`
    contenido += `Cuotas pagadas: ${cuotasPagadas}\n`
    contenido += `Cuotas pendientes: ${cuotasPendientes}\n`
    contenido += `Saldo pendiente: ${formatImporte(saldoPendiente)}\n\n`
    contenido += `═══════════════════════════════════════════════════\n`
    contenido += `Este comprobante tiene carácter informativo.\n`
    contenido += `Generado el ${new Date().toLocaleString('es-AR')}\n`
    contenido += `ISPI Nro 4019 "San Juan Bautista"\n`
    contenido += `═══════════════════════════════════════════════════\n`

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ISPI4019_${alumno.apellido}_${alumno.dni}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setDescargando(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf7f2',
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
      color: '#0f172a'
    }}>
      {/* Barra superior institucional */}
      <div style={{
        background: '#0f172a',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '3px solid #d4a574'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'white',
            borderRadius: '8px',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src="/logo-ispi.png" alt="ISPI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '14px', letterSpacing: '0.5px' }}>
              ISPI Nro 4019
            </div>
            <div style={{ color: '#d4a574', fontSize: '11px', letterSpacing: '1px' }}>
              SAN JUAN BAUTISTA
            </div>
          </div>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
          Portal del Alumno
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 24px'
      }}>

        {pantalla === 'consulta' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '60px',
            alignItems: 'center',
            minHeight: '70vh'
          }}>
            {/* Columna izquierda: Texto */}
            <div>
              <div style={{
                display: 'inline-block',
                background: '#d4a574',
                color: '#0f172a',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '1px',
                marginBottom: '24px'
              }}>
                SISTEMA DE CONSULTAS
              </div>
              <h1 style={{
                fontSize: '52px',
                fontWeight: '800',
                lineHeight: '1.1',
                margin: '0 0 20px',
                color: '#0f172a'
              }}>
                Tu estado<br />
                <span style={{ color: '#d4a574' }}>de cuenta</span><br />
                en un clic.
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#64748b',
                lineHeight: '1.6',
                maxWidth: '420px'
              }}>
                Consultá tus cuotas, descargá comprobantes y mantenete al día con tus pagos de forma simple y segura.
              </p>

              <div style={{
                display: 'flex',
                gap: '32px',
                marginTop: '40px'
              }}>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>100%</div>
                  <div style={{ fontSize: '12px', color: '#64748b', letterSpacing: '0.5px' }}>SEGURO</div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>24/7</div>
                  <div style={{ fontSize: '12px', color: '#64748b', letterSpacing: '0.5px' }}>DISPONIBLE</div>
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>PDF</div>
                  <div style={{ fontSize: '12px', color: '#64748b', letterSpacing: '0.5px' }}>COMPROBANTE</div>
                </div>
              </div>
            </div>

            {/* Columna derecha: Formulario */}
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '48px 40px',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: '0 0 8px',
                color: '#0f172a'
              }}>
                Ingresá tu DNI
              </h2>
              <p style={{
                color: '#64748b',
                fontSize: '14px',
                margin: '0 0 32px'
              }}>
                Completá los 8 dígitos para buscar
              </p>

              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <input
                  type="text"
                  placeholder="00.000.000"
                  maxLength="8"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '20px',
                    fontWeight: '600',
                    letterSpacing: '2px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#faf7f2',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#d4a574'
                    e.target.style.background = 'white'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.background = '#faf7f2'
                  }}
                />
                {dni.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: dni.length === 8 ? '#10b981' : '#94a3b8',
                    fontWeight: '600'
                  }}>
                    {dni.length}/8
                  </div>
                )}
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2',
                  borderLeft: '4px solid #ef4444',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <p style={{ color: '#991b1b', margin: 0, fontSize: '14px', fontWeight: '500' }}>
                    {error}
                  </p>
                </div>
              )}

              <button
                onClick={() => consultar()}
                disabled={loading || dni.length < 7}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: dni.length === 8 && !loading
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                    : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: dni.length === 8 && !loading ? 'pointer' : 'not-allowed',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? 'BUSCANDO...' : 'CONSULTAR ESTADO DE CUENTA'}
              </button>

              <p style={{
                textAlign: 'center',
                fontSize: '12px',
                color: '#94a3b8',
                marginTop: '20px'
              }}>
                🔒 Tu información está protegida
              </p>
            </div>
          </div>
        )}

        {pantalla === 'resultado' && alumno && (
          <div>
            {/* Header del alumno */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '24px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px'
            }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  color: '#d4a574',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  marginBottom: '8px'
                }}>
                  ALUMNO
                </div>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  margin: '0 0 8px',
                  color: '#0f172a'
                }}>
                  {alumno.nombre} {alumno.apellido}
                </h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: '#faf7f2',
                    color: '#0f172a',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: '1px solid #e2e8f0'
                  }}>
                    📚 {alumno.carrera}
                  </span>
                  <span style={{
                    background: '#faf7f2',
                    color: '#0f172a',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: '1px solid #e2e8f0'
                  }}>
                    🎓 {alumno.curso}° Año
                  </span>
                  <span style={{
                    background: '#0f172a',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    DNI: {alumno.dni}
                  </span>
                </div>
              </div>
              <button
                onClick={volver}
                style={{
                  background: 'transparent',
                  border: '2px solid #0f172a',
                  color: '#0f172a',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ← Nueva consulta
              </button>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #10b981'
              }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', letterSpacing: '0.5px' }}>
                  PAGADAS
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', marginTop: '8px' }}>
                  {cuotasPagadas}
                </div>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                borderLeft: '4px solid #f97316'
              }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', letterSpacing: '0.5px' }}>
                  PENDIENTES
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#f97316', marginTop: '8px' }}>
                  {cuotasPendientes}
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                borderRadius: '16px',
                padding: '24px',
                color: 'white'
              }}>
                <div style={{ fontSize: '12px', color: '#d4a574', fontWeight: '600', letterSpacing: '0.5px' }}>
                  SALDO TOTAL
                </div>
                <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px' }}>
                  {formatImporte(saldoPendiente)}
                </div>
              </div>
            </div>

            {/* Cuotas */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '24px',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    margin: '0 0 4px',
                    color: '#0f172a'
                  }}>
                    Detalle de cuotas
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                    {totalCuotas} registros encontrados
                  </p>
                </div>
                <button
                  onClick={descargarComprobante}
                  disabled={descargando}
                  style={{
                    background: '#d4a574',
                    color: '#0f172a',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: descargando ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {descargando ? '⏳ Generando...' : '📄 Descargar comprobante'}
                </button>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {cuotas.map((cuota, index) => (
                  <div
                    key={cuota.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr auto',
                      gap: '20px',
                      alignItems: 'center',
                      padding: '20px',
                      background: cuota.pagado ? '#f0fdf4' : '#fff7ed',
                      border: `1px solid ${cuota.pagado ? '#bbf7d0' : '#fed7aa'}`,
                      borderRadius: '12px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: cuota.pagado ? '#10b981' : '#f97316',
                      color: 'white',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '14px'
                    }}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: '700',
                        fontSize: '15px',
                        color: '#0f172a',
                        marginBottom: '4px'
                      }}>
                        {cuota.concepto}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b'
                      }}>
                        Vence: {formatDate(cuota.vencimiento)}
                        {cuota.pagado && cuota.fecha_pago && (
                          <> • Pagado: {formatDate(cuota.fecha_pago)}</>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontWeight: '800',
                        fontSize: '18px',
                        color: cuota.pagado ? '#10b981' : '#f97316'
                      }}>
                        {formatImporte(cuota.importe)}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: cuota.pagado ? '#10b981' : '#f97316',
                        letterSpacing: '0.5px'
                      }}>
                        {cuota.pagado ? '✓ PAGADO' : '⏳ PENDIENTE'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer institucional */}
            <div style={{
              textAlign: 'center',
              padding: '24px',
              color: '#94a3b8',
              fontSize: '12px'
            }}>
              ISPI Nro 4019 "San Juan Bautista" • Documento de carácter informativo
            </div>
          </div>
        )}
      </div>
    </div>
  )
}