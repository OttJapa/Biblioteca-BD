// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = "https://vbtipvmzylabtnrmcfrv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nhg9DPIdt8zNQknolLyZIg_7t63u4Dt";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// CONTROLE DE NAVEGAÇÃO ENTRE SEÇÕES
function mostrarSecao(secao) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    const activeSection = document.getElementById(secao);
    if (activeSection) activeSection.classList.add('active');

    const activeBtn = Array.from(document.querySelectorAll('.nav-item'))
        .find(btn => btn.getAttribute('onclick').includes(secao));
    if (activeBtn) activeBtn.classList.add('active');
}

// FORMATAR DATA (AAAA-MM-DD para DD/MM/AAAA)
function formatarData(data) {
    if (!data) return "Não informado";
    const partes = data.split("-");
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : data;
}

// LIVROS: Carregar Lista
async function carregarLivros() {
    const { data, error } = await supabaseClient
        .from("livros")
        .select("*")
        .order("titulo", { ascending: true });

    const lista = document.getElementById("listaLivros");
    if (error) {
        lista.innerHTML = `<p class="mensagem">Erro ao carregar os livros.</p>`;
        return;
    }

    lista.innerHTML = (!data || data.length === 0) 
        ? `<p class="mensagem-vazia">Nenhum livro cadastrado.</p>` 
        : data.map(l => `
            <div class="item-card">
                <div>
                    <h4>📖 ${l.titulo}</h4>
                    <p><small>Autor: ${l.autor} (${l.ano || 'Não informado'})</small></p>
                    <span class="badge ${l.disponivel ? 'badge-success' : 'badge-danger'}">
                        ${l.disponivel ? 'Disponível' : 'Emprestado'}
                    </span>
                </div>
                ${l.disponivel 
                    ? `<button class="btn btn-danger" onclick="excluirLivro(${l.id})">Excluir</button>` 
                    : ''}
            </div>
        `).join('');

    atualizarSelectLivros(data || []);
}

// LIVROS: Cadastrar
document.getElementById("formLivro").addEventListener("submit", async function(e) {
    e.preventDefault();
    const titulo = document.getElementById("titulo").value.trim();
    const autor = document.getElementById("autor").value.trim();
    const ano = document.getElementById("ano").value;

    const { error } = await supabaseClient.from("livros").insert({
        titulo, autor, ano: ano ? Number(ano) : null, disponivel: true
    });

    if (error) {
        alert("Erro ao cadastrar o livro.");
        return;
    }

    alert("Livro cadastrado com sucesso!");
    this.reset();
    carregarLivros();
});

// LIVROS: Excluir
async function excluirLivro(id) {
    if (!confirm("Deseja realmente excluir este livro?")) return;

    const { data: emprestimos } = await supabaseClient
        .from("emprestimos")
        .select("id")
        .eq("livro_id", id);

    if (emprestimos && emprestimos.length > 0) {
        alert("Este livro possui histórico de empréstimos e não pode ser excluído.");
        return;
    }

    const { error } = await supabaseClient.from("livros").delete().eq("id", id);
    if (!error) {
        alert("Livro excluído com sucesso!");
        carregarLivros();
    } else {
        alert("Erro ao excluir o livro.");
    }
}

// USUÁRIOS: Carregar Lista
async function carregarUsuarios() {
    const { data, error } = await supabaseClient
        .from("usuarios")
        .select("*")
        .order("nome", { ascending: true });

    const lista = document.getElementById("listaUsuarios");
    if (error) return;

    lista.innerHTML = (!data || data.length === 0)
        ? `<p class="mensagem-vazia">Nenhum usuário cadastrado.</p>`
        : data.map(u => `
            <div class="item-card">
                <div>
                    <h4>👤 ${u.nome}</h4>
                    <p><small>${u.email || 'Sem e-mail'}</small></p>
                </div>
                <button class="btn btn-danger" onclick="excluirUsuario(${u.id})">Excluir</button>
            </div>
        `).join('');

    atualizarSelectUsuarios(data || []);
}

// USUÁRIOS: Cadastrar
document.getElementById("formUsuario").addEventListener("submit", async function(e) {
    e.preventDefault();
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();

    const { error } = await supabaseClient.from("usuarios").insert({ nome, email: email || null });
    if (error) {
        alert("Erro ao cadastrar usuário.");
        return;
    }

    alert("Usuário cadastrado com sucesso!");
    this.reset();
    carregarUsuarios();
});

// USUÁRIOS: Excluir
async function excluirUsuario(id) {
    if (!confirm("Deseja realmente excluir este usuário?")) return;

    const { data: emprestimos } = await supabaseClient
        .from("emprestimos")
        .select("id")
        .eq("usuario_id", id);

    if (emprestimos && emprestimos.length > 0) {
        alert("Este usuário possui histórico de empréstimos e não pode ser excluído.");
        return;
    }

    const { error } = await supabaseClient.from("usuarios").delete().eq("id", id);
    if (!error) {
        alert("Usuário excluído com sucesso!");
        carregarUsuarios();
    } else {
        alert("Erro ao excluir o usuário.");
    }
}

// SELETORES PARA FORMULÁRIO DE EMPRÉSTIMO
function atualizarSelectLivros(livros) {
    const select = document.getElementById("livroEmprestimo");
    select.innerHTML = `<option value="">Selecione um livro...</option>` + 
        livros.filter(l => l.disponivel).map(l => `<option value="${l.id}">${l.titulo} - ${l.autor}</option>`).join('');
}

function atualizarSelectUsuarios(usuarios) {
    const select = document.getElementById("usuarioEmprestimo");
    select.innerHTML = `<option value="">Selecione um usuário...</option>` + 
        usuarios.map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
}

// EMPRÉSTIMOS: Registrar
document.getElementById("formEmprestimo").addEventListener("submit", async function(e) {
    e.preventDefault();
    const livro_id = Number(document.getElementById("livroEmprestimo").value);
    const usuario_id = Number(document.getElementById("usuarioEmprestimo").value);

    if (!livro_id || !usuario_id) {
        alert("Selecione o livro e o usuário.");
        return;
    }

    const { error } = await supabaseClient.from("emprestimos").insert({
        livro_id,
        usuario_id,
        data_emprestimo: new Date().toISOString().split("T")[0],
        devolvido: false
    });

    if (!error) {
        await supabaseClient.from("livros").update({ disponivel: false }).eq("id", livro_id);
        alert("Empréstimo registrado com sucesso!");
        this.reset();
        carregarLivros();
        carregarEmprestimos();
    } else {
        alert("Erro ao registrar empréstimo.");
    }
});

// EMPRÉSTIMOS: Carregar Lista
async function carregarEmprestimos() {
    const { data, error } = await supabaseClient
        .from("emprestimos")
        .select(`id, livro_id, data_emprestimo, devolvido, livros(titulo), usuarios(nome)`)
        .order("data_emprestimo", { ascending: false });

    const lista = document.getElementById("listaEmprestimos");
    if (error) return;

    lista.innerHTML = (!data || data.length === 0)
        ? `<p class="mensagem-vazia">Nenhum empréstimo registrado.</p>`
        : data.map(m => `
            <div class="item-card">
                <div>
                    <h4>📖 ${m.livros?.titulo || 'Desconhecido'}</h4>
                    <p><small>Usuário: ${m.usuarios?.nome || 'Desconhecido'}</small></p>
                    <p><small>Data: ${formatarData(m.data_emprestimo)}</small></p>
                    <span class="badge ${m.devolvido ? 'badge-success' : 'badge-danger'}">
                        ${m.devolvido ? 'Devolvido' : 'Em aberto'}
                    </span>
                </div>
                ${!m.devolvido ? `<button class="btn btn-action" onclick="devolverLivro(${m.id},${m.livro_id})">Registrar Devolução</button>` : ''}
            </div>
        `).join('');
}

// EMPRÉSTIMOS: Devolver Livro
async function devolverLivro(emprestimoId, livroId) {
    if (!confirm("Deseja registrar a devolução deste livro?")) return;

    const { error } = await supabaseClient.from("emprestimos")
        .update({ devolvido: true, data_devolucao: new Date().toISOString().split("T")[0] })
        .eq("id", emprestimoId);

    if (!error) {
        await supabaseClient.from("livros").update({ disponivel: true }).eq("id", livroId);
        alert("Devolução registrada com sucesso!");
        carregarLivros();
        carregarEmprestimos();
    } else {
        alert("Erro ao registrar devolução.");
    }
}

// INICIALIZAÇÃO
mostrarSecao("livros");
carregarLivros();
carregarUsuarios();
carregarEmprestimos();