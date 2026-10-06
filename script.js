// --- CONFIGURAÇÕES DO PIX ---
const PIX_CONFIG = {
  // Telefone deve incluir o código do país (+55) no padrão Pix
  chave: "+5521991747840",
  beneficiario: "PEDRO BRITTO",
  cidade: "RIO DE JANEIRO"           
};

// --- ELEMENTOS DO DOM ---
const modal = document.getElementById("modalpix");
const btnFecharModal = document.getElementById("btnFecharModal");
const modalItemNome = document.getElementById("modalItemNome");
const modalItemValor = document.getElementById("modalItemValor");
const qrcodeCanvas = document.getElementById("qrcodeCanvas");
const pixCodigoInput = document.getElementById("pixCodigoInput");
const btnCopiarPix = document.getElementById("btnCopiarPix");
const cards = document.querySelectorAll(".presente-card");
const cart = [];

// --- FUNÇÕES PIX (PADRÃO BR CODE / EMV) ---
function formatarCampoPix(id, valor) {
  const tamanho = valor.length.toString().padStart(2, "0");
  return `${id}${tamanho}${valor}`;
}

function calcularCRC16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function gerarPixCopiaECola(chave, nome, cidade, valor) {
  const valorFormatado = valor.toFixed(2);
  const infoAdicional = formatarCampoPix("05", "***");

  let payload =
    formatarCampoPix("00", "01") +
    formatarCampoPix(
      "26",
      formatarCampoPix("00", "BR.GOV.BCB.PIX") + formatarCampoPix("01", chave)
    ) +
    formatarCampoPix("52", "0000") +
    formatarCampoPix("53", "986") +
    formatarCampoPix("54", valorFormatado) +
    formatarCampoPix("58", "BR") +
    formatarCampoPix("59", nome.substring(0, 25)) +
    formatarCampoPix("60", cidade.substring(0, 15)) +
    formatarCampoPix("62", infoAdicional) +
    "6304";

  return payload + calcularCRC16(payload);
}

// --- FUNÇÃO PARA DESENHAR O QR CODE ---
function desenharQRCode(codigoPix) {
  if (typeof QRCode !== "undefined" && QRCode.toCanvas) {
    QRCode.toCanvas(
      qrcodeCanvas,
      codigoPix,
      {
        width: 200,
        margin: 2,
        color: {
          dark: "#4A3B32",
          light: "#FFFFFF"
        }
      },
      (error) => {
        if (error) console.error("Erro no QRCode:", error);
      }
    );
  } else {
    // Fallback: se a biblioteca não carregar por bloqueador de anúncios ou falha de rede,
    // usa a API de QR Code gratuita substituindo temporariamente o canvas por uma imagem
    console.warn("Biblioteca QRCode não encontrada. Usando gerador de imagem alternativo.");
    const imgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(codigoPix)}`;
    
    const wrapper = document.querySelector(".qrcode-wrapper");
    wrapper.innerHTML = `<img src="${imgUrl}" alt="QR Code Pix" width="200" height="200" />`;
  }
}

// --- EVENTOS ---
cards.forEach((card) => {
  const btnPresentear = card.querySelector(".presente-comprar");

 btnPresentear.addEventListener("click", (e) => {
    e.preventDefault();

    const titulo = card.querySelector("h3").innerText;
    const precoTexto = card.querySelector(".presente-preco").innerText;
    
    const precoNumerico = parseFloat(
      precoTexto.replace("R$", "").replace(".", "").replace(",", ".").trim()

    );

    addToCart(titulo, precoNumerico);

    modalItemNome.innerText = titulo;
    modalItemValor.innerText = precoTexto.replace("R$", "").trim();

    const pixPayload = gerarPixCopiaECola(
      PIX_CONFIG.chave,
      PIX_CONFIG.beneficiario,
      PIX_CONFIG.cidade,
      precoNumerico
    );

    pixCodigoInput.value = pixPayload;

    // 1º: Torna o modal visível na tela
    modal.classList.add("ativo");

    // 2º: Desenha o QR Code (agora que o canvas já tem dimensões visíveis)
    desenharQRCode(pixPayload);
  });
});

// Fechar modal no botão X
btnFecharModal.addEventListener("click", () => {
  modal.classList.remove("ativo");
});

// Fechar ao clicar fora da caixinha (no overlay)
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("ativo"); 
  }
});

// Copiar código Pix
btnCopiarPix.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(pixCodigoInput.value);
    const textoOriginal = btnCopiarPix.innerText;
    btnCopiarPix.innerText = "Copiado! ✅";
    setTimeout(() => {
      btnCopiarPix.innerText = textoOriginal;
    }, 2000);
  } catch (err) {
    pixCodigoInput.select();
    document.execCommand("copy");
    alert("Código Pix copiado!");
  }
});

//Adicionar ao carrinho
function addToCart(itemName, itemPrice) {
    const itensListUl = document.getElementById("itens-list");
    const li = document.createElement("li");
    const deleteItemBtn = document.createElement("button");
    let totalCart = document.getElementById("totalCart");
    

    li.classList.add("item-cart-lista");
    deleteItemBtn.classList.add("delete-item-btn");
    deleteItemBtn.textContent = "❌ ";
    li.textContent = `${itemName}`;
    li.appendChild(deleteItemBtn);
    itensListUl.appendChild(li);

    cart.push(sumItensToCart(itemPrice));
    totalCart.textContent = `Total: R$ ${cart.reduce((acc, curr) => acc + curr, 0).toFixed(2).replace(".", ",")}`;
    


}

function sumItensToCart(itemPrice){
  
  let currentTotal = 0;

  currentTotal += itemPrice;

  return currentTotal;
}