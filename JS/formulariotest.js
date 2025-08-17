document.getElementById("registroForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const data = {
    nombre: document.getElementById("nombre").value,
    apellido: document.getElementById("apellido").value,
    edad: parseInt(document.getElementById("edad").value)
  };

  await fetch("/guardar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  cargarUsuarios();
});

async function cargarUsuarios() {
  const res = await fetch("/usuarios");
  const usuarios = await res.json();
  const lista = document.getElementById("listaUsuarios");
  lista.innerHTML = "";
  usuarios.forEach(u => {
    const li = document.createElement("li");
    li.textContent = `${u.nombre} ${u.apellido}, ${u.edad} años`;
    lista.appendChild(li);
  });
}

window.onload = cargarUsuarios;