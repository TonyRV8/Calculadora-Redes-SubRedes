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
    
    // Hosts totales y saltos
    const totalHosts = Math.pow(2, 32 - maskInt);
    const jump = totalHosts;
    const networkBase = ipParts.map((part, i) => part & subnetMask[i]);

    const ranges = [];
    for (let i = 0; i < 256; i += jump) {
        const rangeStart = networkBase.slice(0, 3).concat(i);
        ranges.push(rangeStart.join("."));
    }

    // Crear la tabla
    let tabla = "<table><thead><tr><th>Subred</th></tr></thead><tbody>";
    ranges.forEach(range => {
        tabla += `<tr><td>${range}</td></tr>`;
    });
    tabla += "</tbody></table>";

    resultados.innerHTML = `
        <p>Clase: ${determineClass(ipParts[0])}</p>
        <p>Máscara de subred: ${subnetMaskString}</p>
        <p>Hosts totales: ${totalHosts}</p>
        ${tabla}
    `;
}

// Identifica la clase de IP
function determineClass(firstOctet) {
    if (firstOctet >= 0 && firstOctet <= 127) return "A";
    if (firstOctet >= 128 && firstOctet <= 191) return "B";
    if (firstOctet >= 192 && firstOctet <= 223) return "C";
    if (firstOctet >= 224 && firstOctet <= 239) return "D (Multicast)";
    return "E (Reservada)";
}
