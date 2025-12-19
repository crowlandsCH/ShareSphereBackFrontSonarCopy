import { useEffect, useState } from 'react'

interface User {
  name: string
  displayName?: string
  roles?: string[]
}

interface Company {
  companyId: number
  name: string
  tickerSymbol: string
  exchangeId: number
  stockExchange?: {
    exchangeId: number
    name:  string
    country: string
    currency: string
  }
}

interface Share {
  shareId: number
  companyId:  number
  price:  number
  availableQuantity:  number
}

interface Trade {
  tradeId: number
  companyId: number
  brokerId: number
  quantity:  number
  unitPrice: number
  timestamp: string
  type:  'Buy' | 'Sell'
}

interface Broker {
  brokerId: number
  name: string
  licenseNumber: string
  email:  string
}

interface Shareholder {
  shareholderId: number
  name: string
  email: string
  portfolioValue:  number
}

interface StockExchange {
  exchangeId:  number
  name: string
  country: string
  currency: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [shares, setShares] = useState<Share[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [shareholders, setShareholders] = useState<Shareholder[]>([])
  const [stockExchanges, setStockExchanges] = useState<StockExchange[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL:  string = import.meta.env.VITE_API_URL || 'https://localhost:7189'

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  const fetchDashboardData = async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      // Benutzerinformationen abrufen
      const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: getAuthHeaders()
      })

      if (userResponse.ok) {
        const userData:  User = await userResponse.json()
        setUser(userData)
      }

      // Alle Daten parallel abrufen
      const [
        companiesRes,
        sharesRes,
        tradesRes,
        brokersRes,
        shareholdersRes,
        exchangesRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/companies`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/shares`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/trades`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/brokers`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/shareholders`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/stockexchanges`, { headers: getAuthHeaders() })
      ])

      if (companiesRes.ok) {
        const companiesData: Company[] = await companiesRes.json()
        setCompanies(companiesData)
      }
      if (sharesRes.ok) {
        const sharesData: Share[] = await sharesRes.json()
        setShares(sharesData)
      }
      if (tradesRes. ok) {
        const tradesData: Trade[] = await tradesRes.json()
        setTrades(tradesData)
      }
      if (brokersRes.ok) {
        const brokersData: Broker[] = await brokersRes.json()
        setBrokers(brokersData)
      }
      if (shareholdersRes. ok) {
        const shareholdersData: Shareholder[] = await shareholdersRes.json()
        setShareholders(shareholdersData)
      }
      if (exchangesRes.ok) {
        const exchangesData:  StockExchange[] = await exchangesRes.json()
        setStockExchanges(exchangesData)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ?  err.message : 'Unbekannter Fehler'
      setError('Fehler beim Laden der Dashboard-Daten: ' + errorMessage)
      console.error('Dashboard Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = (): void => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Lade Dashboard-Daten...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>ShareSphere Dashboard</h1>
        {user && (
          <div className="user-info">
            <span>Willkommen, {user.displayName || user.name}</span>
            {user.roles && <span className="user-roles">({user.roles.join(', ')})</span>}
            <button onClick={handleLogout} className="btn-logout">Abmelden</button>
          </div>
        )}
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-grid">
        {/* Statistik-Karten */}
        <div className="stats-row">
          <div className="stat-card">
            <h3>Unternehmen</h3>
            <div className="stat-value">{companies.length}</div>
          </div>
          <div className="stat-card">
            <h3>Aktien</h3>
            <div className="stat-value">{shares.length}</div>
          </div>
          <div className="stat-card">
            <h3>Trades</h3>
            <div className="stat-value">{trades.length}</div>
          </div>
          <div className="stat-card">
            <h3>Broker</h3>
            <div className="stat-value">{brokers. length}</div>
          </div>
          <div className="stat-card">
            <h3>Aktionäre</h3>
            <div className="stat-value">{shareholders.length}</div>
          </div>
          <div className="stat-card">
            <h3>Börsen</h3>
            <div className="stat-value">{stockExchanges.length}</div>
          </div>
        </div>

        {/* Unternehmen */}
        <section className="dashboard-section">
          <h2>Unternehmen</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Ticker</th>
                  <th>Börse</th>
                </tr>
              </thead>
              <tbody>
                {companies.slice(0, 5).map(company => (
                  <tr key={company.companyId}>
                    <td>{company. name}</td>
                    <td><strong>{company.tickerSymbol}</strong></td>
                    <td>{company.stockExchange?.name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {companies.length > 5 && (
              <p className="table-info">... und {companies.length - 5} weitere</p>
            )}
          </div>
        </section>

        {/* Aktien */}
        <section className="dashboard-section">
          <h2>Aktuelle Aktienpreise</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Company ID</th>
                  <th>Preis</th>
                  <th>Verfügbar</th>
                </tr>
              </thead>
              <tbody>
                {shares.slice(0, 5).map(share => (
                  <tr key={share.shareId}>
                    <td>{share.companyId}</td>
                    <td className="price">{share.price?. toFixed(2)} €</td>
                    <td>{share.availableQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shares.length > 5 && (
              <p className="table-info">... und {shares. length - 5} weitere</p>
            )}
          </div>
        </section>

        {/* Letzte Trades */}
        <section className="dashboard-section">
          <h2>Letzte Handelsgeschäfte</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Menge</th>
                  <th>Preis</th>
                  <th>Datum</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 5).map(trade => (
                  <tr key={trade.tradeId}>
                    <td>
                      <span className={`trade-type ${trade.type?. toLowerCase()}`}>
                        {trade.type}
                      </span>
                    </td>
                    <td>{trade.quantity}</td>
                    <td className="price">{trade.unitPrice?.toFixed(2)} €</td>
                    <td>{new Date(trade.timestamp).toLocaleDateString('de-DE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trades.length > 5 && (
              <p className="table-info">... und {trades.length - 5} weitere</p>
            )}
          </div>
        </section>

        {/* Broker */}
        <section className="dashboard-section">
          <h2>Registrierte Broker</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Lizenz</th>
                  <th>E-Mail</th>
                </tr>
              </thead>
              <tbody>
                {brokers.slice(0, 5).map(broker => (
                  <tr key={broker.brokerId}>
                    <td>{broker.name}</td>
                    <td>{broker.licenseNumber}</td>
                    <td>{broker.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {brokers.length > 5 && (
              <p className="table-info">... und {brokers.length - 5} weitere</p>
            )}
          </div>
        </section>

        {/* Aktionäre */}
        <section className="dashboard-section">
          <h2>Top Aktionäre</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>E-Mail</th>
                  <th>Portfolio-Wert</th>
                </tr>
              </thead>
              <tbody>
                {shareholders
                  .sort((a, b) => (b.portfolioValue || 0) - (a.portfolioValue || 0))
                  .slice(0, 5)
                  .map(shareholder => (
                    <tr key={shareholder.shareholderId}>
                      <td>{shareholder.name}</td>
                      <td>{shareholder.email}</td>
                      <td className="price">{shareholder.portfolioValue?.toFixed(2)} €</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {shareholders.length > 5 && (
              <p className="table-info">... und {shareholders.length - 5} weitere</p>
            )}
          </div>
        </section>

        {/* Börsen */}
        <section className="dashboard-section">
          <h2>Börsen</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Land</th>
                  <th>Währung</th>
                </tr>
              </thead>
              <tbody>
                {stockExchanges. map(exchange => (
                  <tr key={exchange.exchangeId}>
                    <td>{exchange.name}</td>
                    <td>{exchange.country}</td>
                    <td><strong>{exchange.currency}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}