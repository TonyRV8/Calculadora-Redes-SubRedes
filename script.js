function calcular() {
    const input = document.getElementById("ip").value;
    const resultados = document.getElementById("resultados");
    resultados.innerHTML = "";

    if (!/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(input)) {
        resultados.innerHTML = "<p style='color: red;'>Formato inválido. Por favor, usa algo como 192.168.100.25/30</p>";
        return;
    }

    const [ip, maskBits] = input.split("/");
    const maskInt = parseInt(maskBits, 10);

    if (maskInt < 0 || maskInt > 32) {
        resultados.innerHTML = "<p style='color: red;'>Máscara inválida. Debe estar entre 0 y 32.</p>";
        return;
    }

    const ipParts = ip.split(".").map(Number);
    if (ipParts.some(part => part < 0 || part > 255)) {
        resultados.innerHTML = "<p style='color: red;'>Dirección IP inválida.</p>";
        return;
    }

    // Máscara de subred
    const subnetMask = Array(32).fill(0).fill(1, 0, maskInt).join("").match(/.{1,8}/g).map(bin => parseInt(bin, 2));
    const subnetMaskString = subnetMask.join(".");

    // Hosts totales, usable hosts y salto entre subredes
    const totalHosts = Math.pow(2, 32 - maskInt);
    const usableHosts = totalHosts > 2 ? totalHosts - 2 : 0; // Restar 2 si hay más de 2 hosts posibles
    const subnetSize = totalHosts;

    // Número de subredes
    const numSubnets = Math.pow(2, maskInt % 8); // Número de subredes dentro del rango
    const subnets = [];

    // Calcular dirección de red base
    const startAddressInt = ipToInteger(ipParts);

    // Calcular todas las subredes
    for (let i = 0; i < numSubnets; i++) {
        const subnetStartInt = startAddressInt + i * subnetSize;
        const subnetBroadcastInt = subnetStartInt + subnetSize - 1;

        subnets.push({
            start: integerToIp(subnetStartInt),
            broadcast: integerToIp(subnetBroadcastInt),
        });
    }

    // Crear tabla de subredes
    let tabla = "<table><thead><tr><th>Subred</th><th>Broadcast</th></tr></thead><tbody>";
    subnets.forEach(({ start, broadcast }) => {
        tabla += `<tr><td>${start}</td><td>${broadcast}</td></tr>`;
    });
    tabla += "</tbody></table>";

    resultados.innerHTML = `
        <p>Clase: ${determineClass(ipParts[0])}</p>
        <p>Máscara de subred: ${subnetMaskString}</p>
        <p>Hosts totales: ${totalHosts}</p>
        <p>Hosts utilizables: ${usableHosts}</p>
        <p>Número de subredes: ${numSubnets}</p>
        <p>Dirección de red: ${integerToIp(startAddressInt)}</p>
        <p>Broadcast: ${integerToIp(startAddressInt + totalHosts - 1)}</p>
        ${tabla}
    `;
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

// Identifica la clase de IP
function determineClass(firstOctet) {
    if (firstOctet >= 0 && firstOctet <= 127) return "A";
    if (firstOctet >= 128 && firstOctet <= 191) return "B";
    if (firstOctet >= 192 && firstOctet <= 223) return "C";
    if (firstOctet >= 224 && firstOctet <= 239) return "D (Multicast)";
    return "E (Reservada)";
}
