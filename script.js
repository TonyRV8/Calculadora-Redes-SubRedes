function calcular() {
    const ipInput = document.getElementById("ip").value;
    const maskInput = parseInt(document.getElementById("mask").value, 10);
    const subnetMaskInput = parseInt(document.getElementById("subnetMask").value, 10) || null;
    const resultados = document.getElementById("resultados");
    resultados.innerHTML = "";

    // Validaciones
    if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ipInput)) {
        resultados.innerHTML = "<p style='color: red;'>Formato de dirección IP inválido.</p>";
        return;
    }
    if (maskInput < 0 || maskInput > 32) {
        resultados.innerHTML = "<p style='color: red;'>La máscara debe estar entre 0 y 32 bits.</p>";
        return;
    }
    if (subnetMaskInput && (subnetMaskInput <= maskInput || subnetMaskInput > 32)) {
        resultados.innerHTML = "<p style='color: red;'>La nueva máscara debe ser mayor a la máscara actual y no puede exceder 32 bits.</p>";
        return;
    }

    const ipParts = ipInput.split(".").map(Number);
    const maskBits = subnetMaskInput || maskInput;

    // Cálculo de la máscara de subred
    const subnetMask = Array(32).fill(0).fill(1, 0, maskBits).join("").match(/.{1,8}/g).map(bin => parseInt(bin, 2));
    const subnetMaskString = subnetMask.join(".");
    const totalHosts = Math.pow(2, 32 - maskBits);
    const usableHosts = totalHosts > 2 ? totalHosts - 2 : 0;

    const networkBase = ipParts.map((part, i) => part & subnetMask[i]);
    const broadcast = networkBase.map((part, i) => part | ~subnetMask[i] & 255);
    const hostMin = [...networkBase];
    hostMin[3] += 1;
    const hostMax = [...broadcast];
    hostMax[3] -= 1;

    resultados.innerHTML = `
        <p><strong>Dirección IP:</strong> ${ipInput}</p>
        <p><strong>Máscara:</strong> ${subnetMaskString} (${maskBits} bits)</p>
        <p><strong>Hosts totales:</strong> ${totalHosts}</p>
        <p><strong>Hosts utilizables:</strong> ${usableHosts}</p>
        <p><strong>Rango de direcciones:</strong> ${networkBase.join(".")} - ${broadcast.join(".")}</p>
        <p><strong>Host mínimo:</strong> ${hostMin.join(".")}</p>
        <p><strong>Host máximo:</strong> ${hostMax.join(".")}</p>
        <p><strong>Broadcast:</strong> ${broadcast.join(".")}</p>
    `;

    // Subneteo adicional
    if (subnetMaskInput) {
        resultados.innerHTML += "<h3>Subredes:</h3>";
        const subnets = [];
        const subnetSize = Math.pow(2, 32 - subnetMaskInput);
        const startAddressInt = ipToInteger(networkBase);

        for (let i = 0; i < Math.pow(2, subnetMaskInput - maskInput); i++) {
            const subnetStartInt = startAddressInt + i * subnetSize;
            const subnetBroadcastInt = subnetStartInt + subnetSize - 1;
            const subnetStart = integerToIp(subnetStartInt);
            const subnetBroadcast = integerToIp(subnetBroadcastInt);

            const subnetHostMin = integerToIp(subnetStartInt + 1);
            const subnetHostMax = integerToIp(subnetBroadcastInt - 1);

            subnets.push({
                start: subnetStart,
                broadcast: subnetBroadcast,
                hostMin: subnetHostMin,
                hostMax: subnetHostMax,
            });
        }

        let tabla = "<table><thead><tr><th>Subred</th><th>Host mínimo</th><th>Host máximo</th><th>Broadcast</th></tr></thead><tbody>";
        subnets.forEach(({ start, hostMin, hostMax, broadcast }) => {
            tabla += `<tr>
                        <td>${start}</td>
                        <td>${hostMin}</td>
                        <td>${hostMax}</td>
                        <td>${broadcast}</td>
                      </tr>`;
        });
        tabla += "</tbody></table>";
        resultados.innerHTML += tabla;
    }
}

// Convierte una dirección IP en entero
function ipToInteger(ip) {
    return ip.reduce((acc, octet) => (acc << 8) | octet, 0);
}

// Convierte un entero a dirección IP
function integerToIp(integer) {
    return [
        (integer >>> 24) & 255,
        (integer >>> 16) & 255,
        (integer >>> 8) & 255,
        integer & 255,
    ].join(".");
}
