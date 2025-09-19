
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

function App() {
  const [precio, setPrecio] = useState("");
  const [datos, setDatos] = useState([]);
  const [bancos, setBancos] = useState([]);
  const [formas, setFormas] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [plazo, setPlazo] = useState("");
  const [moneda, setMoneda] = useState("");
  const [tiposEmpresa, setTiposEmpresa] = useState([]);
  const [usarAlternativaPropia, setUsarAlternativaPropia] = useState(false);
  const [alternativaRecuperar, setAlternativaRecuperar] = useState("");
  const [alternativaBanco, setAlternativaBanco] = useState("");
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    fetch("/datos.xlsx")
      .then((res) => res.arrayBuffer())
      .then((ab) => {
        const wb = XLSX.read(ab, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        setDatos(json);
      });
  }, []);

  const opcionesUnicas = (campo, esNumero = false) => {
    const opciones = [...new Set(datos.map(d => String(d[campo] || "").trim()).filter(v => v !== ""))];
    return opciones.sort((a, b) => esNumero ? parseFloat(a) - parseFloat(b) : a.localeCompare(b));
  };

  const handleCheckbox = (valor, lista, setLista) => {
    if (lista.includes(valor)) {
      setLista(lista.filter((v) => v !== valor));
    } else {
      setLista([...lista, valor]);
    }
  };

  const handleReset = () => window.location.reload();

  const handleSimular = () => {
    const filtradas = [];

    bancos.forEach((banco) => {
      formas.forEach((forma) => {
        convenios.forEach((conv) => {
          tiposEmpresa.forEach((tipoEmp) => {
            const fila = datos.find((f) =>
              String(f["Banco"] || "").trim() === banco &&
              String(f["Forma de financiación"] || "").trim() === forma &&
              String(f["Convenio Tasa 0% / Financia banco"] || "").trim() === conv &&
              String(f["Plazo"] || "").trim() === plazo &&
              String(f["Moneda"] || "").trim() === moneda &&
              String(f["Tipo de Empresa"] || "").trim() === tipoEmp
            );
            if (fila) {
              const tasaRecuperar = parseFloat(fila["Tasa a recuperar / Costo de Procesamiento"] || 0) / 100;
              const tasaBanco = parseFloat(fila["Interes del Banco por el plazo elegido"] || 0) / 100;
              const monto = parseFloat(precio);
              const precioFinal = monto * (1 + tasaRecuperar) * (1 + tasaBanco);
              const tna = ((1 + tasaRecuperar) * (1 + tasaBanco) - 1) / parseFloat(plazo) * 365;
              filtradas.push({
                Banco: banco,
                Forma: forma,
                Convenio: conv,
                TipoEmpresa: tipoEmp,
                Precio: `$${precioFinal.toFixed(2)}`,
                TNA: `${(tna * 100).toFixed(2)}%`,
                TasaRecuperar: `${(tasaRecuperar * 100).toFixed(2)}%`,
                TasaBanco: `${(tasaBanco * 100).toFixed(2)}%`,
                MontoFacturado: `$${(monto * (1 + tasaRecuperar)).toFixed(2)}`
              });
            }
          });
        });
      });
    });

    if (usarAlternativaPropia && alternativaRecuperar !== "" && alternativaBanco !== "" && plazo && precio) {
      const tasaRecuperar = parseFloat(alternativaRecuperar) / 100;
      const tasaBanco = parseFloat(alternativaBanco) / 100;
      const monto = parseFloat(precio);
      const precioFinal = monto * (1 + tasaRecuperar) * (1 + tasaBanco);
      const tna = ((1 + tasaRecuperar) * (1 + tasaBanco) - 1) / parseFloat(plazo) * 365;
      filtradas.push({
        MontoFacturado: `$${(monto * (1 + tasaRecuperar)).toFixed(2)}`,
        Banco: "Otra alternativa",
        Forma: "-",
        Convenio: "-",
        TipoEmpresa: "-",
        Precio: `$${precioFinal.toFixed(2)}`,
        TNA: `${(tna * 100).toFixed(2)}%`,
        TasaRecuperar: `${(tasaRecuperar * 100).toFixed(2)}%`,
        TasaBanco: `${(tasaBanco * 100).toFixed(2)}%`
      });
    }

    filtradas.sort((a, b) => parseFloat(a.TNA) - parseFloat(b.TNA));
    setResultados(filtradas);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Simulador Financiero</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <h3>Precio</h3>
          <input
            type="number"
            placeholder="Precio contado"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          <br />
        </div>

        <div style={{ flex: 1, minWidth: 250 }}>
          <h3>Bancos</h3>
          {opcionesUnicas("Banco").map((b, i) => (
            <label key={i}>
              <input type="checkbox" onChange={() => handleCheckbox(b, bancos, setBancos)} /> {b}
            </label>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 250 }}>
          <h3>Financiación</h3>
          <label>Forma</label>
          {opcionesUnicas("Forma de financiación").map((f, i) => (
            <label key={i}>
              <input type="checkbox" onChange={() => handleCheckbox(f, formas, setFormas)} /> {f}
            </label>
          ))}
          <label>Convenio</label>
          {opcionesUnicas("Convenio Tasa 0% / Financia banco").map((c, i) => (
            <label key={i}>
              <input type="checkbox" onChange={() => handleCheckbox(c, convenios, setConvenios)} /> {c}
            </label>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 250 }}>
          <h3>Tipo de Empresa</h3>
          {opcionesUnicas("Tipo de Empresa").map((t, i) => (
            <label key={i}>
              <input type="checkbox" onChange={() => handleCheckbox(t, tiposEmpresa, setTiposEmpresa)} /> {t}
            </label>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 250 }}>
          <h3>Plazo y Moneda</h3>
          <label>Plazo</label>
          <select onChange={(e) => setPlazo(e.target.value)}>
            <option value="">Seleccionar</option>
            {opcionesUnicas("Plazo", true).map((p, i) => (
              <option key={i}>{p}</option>
            ))}
          </select>
          <label>Moneda</label>
          <select onChange={(e) => setMoneda(e.target.value)}>
            <option value="">Seleccionar</option>
            {opcionesUnicas("Moneda").map((m, i) => (
              <option key={i}>{m}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 250 }}>
          <h3>Otra Alternativa</h3>
          <label>
            <input
              type="checkbox"
              checked={usarAlternativaPropia}
              onChange={(e) => setUsarAlternativaPropia(e.target.checked)}
            /> Usar alternativa manual
          </label>
          {usarAlternativaPropia && (
            <div>
              <input
                type="number"
                placeholder="Tasa a recuperar (%)"
                value={alternativaRecuperar}
                onChange={(e) => setAlternativaRecuperar(e.target.value)}
              />
              <input
                type="number"
                placeholder="Interés Banco (%)"
                value={alternativaBanco}
                onChange={(e) => setAlternativaBanco(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={handleSimular}>Simular</button>
        <button onClick={handleReset} style={{ marginLeft: 10, backgroundColor: "#aaa" }}>Limpiar</button>
      </div>

      {resultados.length > 0 && plazo ? (
        <div style={{ marginTop: 30 }}>
          <h2>{`Alternativas a ${plazo} días`}</h2>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Banco</th>
                <th>Tipo Empresa</th>
                <th>Forma</th>
                <th>Convenio</th>
                <th>Precio Final</th>
                <th>TNA total</th>
                <th>Tasa a recuperar</th>
                <th>Monto facturado</th>
                <th>Interés Banco</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, i) => (
                <tr key={i} style={{ backgroundColor: i === 0 ? "#d5f5e3" : "" }}>
                  <td>{r.Banco}</td>
                  <td>{r.TipoEmpresa}</td>
                  <td>{r.Forma}</td>
                  <td>{r.Convenio}</td>
                  <td style={{ fontWeight: "bold", backgroundColor: "#fef9e7" }}>{r.Precio}</td>
                  <td style={{ fontWeight: "bold", backgroundColor: "#fef9e7" }}>{r.TNA}</td>
                  <td>{r.TasaRecuperar}</td>
                  <td>{r.MontoFacturado}</td>
                  <td>{r.TasaBanco}</td>
                </tr>
              ))}
            </tbody>
          </table>
        
      {resultados.length > 0 && plazo ? (
        <div style={{ marginTop: 10 }}>
          <p style={{ color: "red", fontWeight: "bold" }}>
            Es posible que alguna de las combinaciones seleccionadas no se encuentre disponible.
            Recuerde que puede utilizar OTRA ALTERNATIVA para realizar consultas personalizadas.
          </p>
        </div>
      ) : null}
</div>
      ) : null}
    </div>
  );
}

export default App;
