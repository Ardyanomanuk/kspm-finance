// ========================================
// KONFIGURASI API
// ========================================

const API_URL = "https://script.google.com/macros/s/AKfycbzQ7UT_TZ0HG8U9zWfDrMq3yFeGsFx-rEOBhB6ug7R98uBA4FOgOxIQu_0RnjR6ExT_/exec";


// ========================================
// AUTHENTICATION
// ========================================

let currentUser = null;
let sessionToken = null;


// ===============================
// LOGIN
// ===============================

async function login(username, password) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "login",
                username: username,
                password: password
            })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "Login gagal");
        }

        // Simpan session
        sessionToken = result.data.token;
        currentUser = result.data.user;

        localStorage.setItem("kspm_session_token", sessionToken);
        localStorage.setItem("kspm_user", JSON.stringify(currentUser));

        // Tampilkan aplikasi
        tampilkanAplikasi();

        // Masuk ke dashboard
        changePage("dashboard");

    } catch (error) {
        console.error("Login error:", error);
        alert(error.message || "Terjadi kesalahan saat login.");
    }
}


function tampilkanAplikasi() {
    const loginPage = document.getElementById("login-page");
    const app = document.getElementById("app");

    if (loginPage) {
        loginPage.style.display = "none";
    }

    if (app) {
        app.style.display = "flex";
    }

    updateUserInfo();
    updatePermissions();
}

function updateUserInfo() {
    if (!currentUser) return;

    const userName = document.getElementById("userName");
    const userRole = document.getElementById("userRole");
    const userAvatar = document.getElementById("userAvatar");

    if (userName) {
        userName.textContent = currentUser.nama || "Pengguna";
    }

    if (userRole) {
        if (currentUser.role === "bendahara") {
            userRole.textContent = "Bendahara";
        } else {
            userRole.textContent = "Anggota";
        }
    }

    if (userAvatar) {
        userAvatar.textContent =
            (currentUser.nama || "P").charAt(0).toUpperCase();
    }
}


function updatePermissions() {
    const isBendahara =
        currentUser &&
        currentUser.role === "bendahara";

    // Tombol tambah transaksi
    const btnTambahTransaksi =
        document.getElementById("btnTambahTransaksi");

    if (btnTambahTransaksi) {
        btnTambahTransaksi.style.display =
            isBendahara ? "" : "none";
    }

    // Semua elemen khusus bendahara
    const onlyBendahara =
        document.querySelectorAll(".only-bendahara");

    onlyBendahara.forEach(element => {
        element.style.display =
            isBendahara ? "" : "none";
    });
}

async function logout() {
    try {
        if (sessionToken) {
            await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "logout",
                    token: sessionToken
                })
            });
        }
    } catch (error) {
        console.error("Logout error:", error);
    }

    // Hapus session lokal
    localStorage.removeItem("kspm_session_token");
    localStorage.removeItem("kspm_user");

    sessionToken = null;
    currentUser = null;

    // Kembali ke login
    const loginPage = document.getElementById("login-page");
    const app = document.getElementById("app");

    if (app) {
        app.style.display = "none";
    }

    if (loginPage) {
        loginPage.style.display = "flex";
    }
}

function initAuth() {
    const savedToken =
        localStorage.getItem("kspm_session_token");

    const savedUser =
        localStorage.getItem("kspm_user");

    if (savedToken && savedUser) {
        try {
            sessionToken = savedToken;
            currentUser = JSON.parse(savedUser);

            tampilkanAplikasi();
            changePage("dashboard");

        } catch (error) {
            console.error("Session lokal rusak:", error);

            localStorage.removeItem("kspm_session_token");
            localStorage.removeItem("kspm_user");
        }

        return;
    }

    // Belum login
    const loginPage = document.getElementById("login-page");
    const app = document.getElementById("app");

    if (app) {
        app.style.display = "none";
    }

    if (loginPage) {
        loginPage.style.display = "flex";
    }
}

document.addEventListener("DOMContentLoaded", function () {

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const username =
                document.getElementById("loginUsername").value.trim();

            const password =
                document.getElementById("loginPassword").value.trim();

            if (!username || !password) {
                alert("Username dan NIM wajib diisi.");
                return;
            }

            await login(username, password);
        });
    }

    initAuth();
});


// ========================================
// ELEMENT HTML
// ========================================

const menuItems =
    document.querySelectorAll(".menu-item");

const pageTitle =
    document.getElementById("page-title");

const pageDescription =
    document.getElementById("page-description");

const appContent =
    document.getElementById("app-content");


// ========================================
// INFORMASI HALAMAN
// ========================================

const pages = {

    dashboard: {
        title: "Dashboard",
        description:
            "Ringkasan keuangan KSPM"
    },

    anggota: {
        title: "Anggota",
        description:
            "Data anggota KSPM"
    },

    kas: {
        title: "Kas",
        description:
            "Pembayaran kas anggota"
    },

    transaksi: {
        title: "Transaksi",
        description:
            "Pencatatan pemasukan dan pengeluaran"
    },

    uranMakrab: {
        title: "Uran Makrab",
        description:
            "Pembayaran iuran makrab"
    },

    lepkeu: {
        title: "LEPKEU",
        description:
            "Laporan keuangan KSPM"
    }

};


// ========================================
// API
// ========================================

async function api(action) {

    try {

        const response = await fetch(
            `${API_URL}?action=${encodeURIComponent(action)}`,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {

            throw new Error(
                `API gagal (${response.status})`
            );

        }

        const result = await response.json();

        if (!result.success) {

            throw new Error(
                result.error ||
                result.message ||
                "Terjadi kesalahan pada API"
            );

        }

        return result.data;

    } catch (error) {

        console.error(
            `API ERROR [${action}]:`,
            error
        );

        throw error;

    }

}


// ========================================
// FORMAT RUPIAH
// ========================================

function rupiah(angka) {

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(angka || 0);

}


// ========================================
// DASHBOARD
// ========================================

// ========================================
// DASHBOARD
// ========================================

async function loadDashboard() {

    appContent.innerHTML = `
        <div class="loading">
            Memuat dashboard...
        </div>
    `;

    try {

        // Ambil semua data yang diperlukan
        const [
            dashboard,
            anggota,
            kas,
            makrab,
            lepkeu
        ] = await Promise.all([
            api("dashboard"),
            api("anggota"),
            api("kas"),
            api("uranMakrab"),
            api("lepkeu")
        ]);

        console.log("DATA DASHBOARD:", dashboard);
        console.log("DATA ANGGOTA:", anggota);
        console.log("DATA KAS:", kas);
        console.log("DATA MAKRAB:", makrab);
        console.log("DATA LEPKEU:", lepkeu);

        renderDashboard({
            dashboard,
            anggota,
            kas,
            makrab,
            lepkeu
        });

    } catch (error) {

        console.error(
            "Gagal mengambil data dashboard:",
            error
        );

        appContent.innerHTML = `
            <div class="error">

                <h2>
                    Gagal mengambil data dashboard
                </h2>

                <p>
                    ${error.message}
                </p>

                <button
                    class="btn-primary"
                    onclick="loadDashboard()"
                >
                    Coba Lagi
                </button>

            </div>
        `;
    }
}

// ========================================
// RENDER DASHBOARD
// ========================================

function renderDashboard(data) {

    const dashboard =
        data.dashboard || {};

    const anggota =
        Array.isArray(data.anggota)
            ? data.anggota
            : [];

    const kas =
        Array.isArray(data.kas)
            ? data.kas
            : [];

    const makrab =
        Array.isArray(data.makrab)
            ? data.makrab
            : [];

    const lepkeu =
        data.lepkeu || {};


    // ========================================
    // JUMLAH ANGGOTA
    // ========================================

    const anggotaAktif =
        anggota.filter(function (item) {

            return String(
                item["Status"] || ""
            ).trim().toLowerCase() === "aktif";

        }).length;


    // ========================================
    // STATUS MAKRAB
    // ========================================

    const makrabLunas =
        makrab.filter(function (item) {

            return item.StatusPembayaran === "Lunas";

        }).length;


    const makrabBelumLunas =
        makrab.filter(function (item) {

            return item.StatusPembayaran === "Belum Lunas";

        }).length;


    const makrabBelumBayar =
        makrab.filter(function (item) {

            return item.StatusPembayaran === "Belum Bayar";

        }).length;
    

    // ========================================
    // TRANSAKSI TERBARU DARI LEPKEU
    // ========================================

    let transaksiTerbaru = [];

    if (
        lepkeu.bulan &&
        Array.isArray(lepkeu.bulan)
    ) {

        lepkeu.bulan.forEach(function (bulan) {

            if (
                bulan.transaksi &&
                Array.isArray(bulan.transaksi)
            ) {

                transaksiTerbaru =
                    transaksiTerbaru.concat(
                        bulan.transaksi
                    );

            }

        });

    }


    // Urutkan berdasarkan tanggal terbaru
    transaksiTerbaru.sort(function (a, b) {

        const tanggalA =
            parseTanggalIndonesia(a.tanggal);

        const tanggalB =
            parseTanggalIndonesia(b.tanggal);

        return tanggalB - tanggalA;

    });


    // Ambil maksimal 5 transaksi
    transaksiTerbaru =
        transaksiTerbaru.slice(0, 5);


    // ========================================
    // HTML DASHBOARD
    // ========================================

    appContent.innerHTML = `

        <div class="dashboard-container">


            <!-- HEADER -->
            <div class="page-header">

                <div>

                    <h2>
                        Dashboard
                    </h2>

                    <p>
                        Ringkasan keuangan KSPM
                        periode 2026
                    </p>

                </div>


                <button
                    class="btn-primary"
                    id="btnRefreshDashboard"
                >
                    ↻ Refresh
                </button>

            </div>


            <!-- SUMMARY CARDS -->
            <div class="cards">


                <!-- SALDO -->
                <div class="card">

                    <div class="card-title">
                        Saldo Akhir
                    </div>

                    <div class="card-value">
                        ${rupiah(
                            dashboard.saldo
                        )}
                    </div>

                </div>


                <!-- PEMASUKAN -->
                <div class="card">

                    <div class="card-title">
                        Total Pemasukan
                    </div>

                    <div class="card-value">
                        ${rupiah(
                            dashboard.pemasukan
                        )}
                    </div>

                </div>


                <!-- PENGELUARAN -->
                <div class="card">

                    <div class="card-title">
                        Total Pengeluaran
                    </div>

                    <div class="card-value">
                        ${rupiah(
                            dashboard.pengeluaran
                        )}
                    </div>

                </div>


                <!-- ANGGOTA -->
                <div class="card">

                    <div class="card-title">
                        Anggota Aktif
                    </div>

                    <div class="card-value">
                        ${anggotaAktif}
                    </div>

                </div>

            </div>


            <!-- MAKRAB -->
            <div class="cards">


                <div class="card">

                    <div class="card-title">
                        Makrab Lunas
                    </div>

                    <div class="card-value">
                        ${makrabLunas}
                    </div>

                </div>


                <div class="card">

                    <div class="card-title">
                        Makrab Belum Lunas
                    </div>

                    <div class="card-value">
                        ${makrabBelumLunas}
                    </div>

                </div>


                <div class="card">

                    <div class="card-title">
                        Makrab Belum Bayar
                    </div>

                    <div class="card-value">
                        ${makrabBelumBayar}
                    </div>

                </div>

            </div>

                <div class="card chart-card">
                    <div class="card-title">Grafik Keuangan 2026</div>

                    <div style="height: 350px;">
                        <canvas id="grafikKeuangan"></canvas>
                    </div>
                </div>


            <!-- TRANSAKSI TERBARU -->
            <div class="panel">

                <div class="page-header">

                    <div>

                        <h3>
                            Transaksi Terbaru
                        </h3>

                        <p>
                            5 transaksi terakhir
                        </p>

                    </div>

                </div>


                <div class="table-container">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Tanggal
                                </th>

                                <th>
                                    Nama
                                </th>

                                <th>
                                    Kategori
                                </th>

                                <th>
                                    Jenis
                                </th>

                                <th>
                                    Nominal
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${
                                transaksiTerbaru.length > 0

                                ?

                                transaksiTerbaru.map(
                                    function (trx) {

                                        const jenis =
                                            String(
                                                trx.jenisTransaksi ||
                                                ""
                                            ).trim();


                                        return `

                                            <tr>

                                                <td>
                                                    ${trx.tanggal || "-"}
                                                </td>

                                                <td>
                                                    ${trx.nama || "-"}
                                                </td>

                                                <td>
                                                    ${trx.kategori || "-"}
                                                </td>

                                                <td>

                                                    <span
                                                        class="status-badge
                                                        ${
                                                            jenis === "Pemasukan"
                                                            ? "status-active"
                                                            : "status-inactive"
                                                        }"
                                                    >
                                                        ${jenis || "-"}
                                                    </span>

                                                </td>

                                                <td>
                                                    ${rupiah(
                                                        trx.nominal
                                                    )}
                                                </td>

                                            </tr>

                                        `;

                                    }
                                ).join("")

                                :

                                `
                                    <tr>

                                        <td
                                            colspan="5"
                                            style="text-align:center;"
                                        >
                                            Belum ada transaksi.
                                        </td>

                                    </tr>
                                `
                            }

                        </tbody>

                    </table>

                </div>

            </div>


            <!-- MAKRAB SUMMARY -->
            <div class="panel">

                <div class="page-header">

                    <div>

                        <h3>
                            Status Iuran Makrab
                        </h3>

                        <p>
                            Ringkasan pembayaran anggota
                        </p>

                    </div>

                </div>


                <div class="cards">

                    <div class="card">

                        <div class="card-title">
                            Lunas
                        </div>

                        <div class="card-value">
                            ${makrabLunas}
                        </div>

                    </div>


                    <div class="card">

                        <div class="card-title">
                            Belum Lunas
                        </div>

                        <div class="card-value">
                            ${makrabBelumLunas}
                        </div>

                    </div>


                    <div class="card">

                        <div class="card-title">
                            Belum Bayar
                        </div>

                        <div class="card-value">
                            ${makrabBelumBayar}
                        </div>

                    </div>

                </div>

            </div>


        </div>

    `;

    renderGrafikKeuangan(lepkeu);


    // ========================================
    // REFRESH
    // ========================================

    const btnRefresh =
        document.getElementById(
            "btnRefreshDashboard"
        );


    if (btnRefresh) {

        btnRefresh.addEventListener(
            "click",
            loadDashboard
        );

    }

}



function renderGrafikKeuangan(lepkeu) {

    const canvas = document.getElementById("grafikKeuangan");

    if (!canvas) return;

    const bulan = lepkeu.bulan || [];

    const labels = bulan.map(item => item.namaBulan);

    const pemasukan = bulan.map(item =>
        Number(item.totalPemasukan) || 0
    );

    const pengeluaran = bulan.map(item =>
        Number(item.totalPengeluaran) || 0
    );

    new Chart(canvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [
                {
                    label: "Pemasukan",

                    data: pemasukan,

                    tension: 0.3,

                    fill: false
                },

                {
                    label: "Pengeluaran",

                    data: pengeluaran,

                    tension: 0.3,

                    fill: false
                }
            ]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "top"
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label +
                                ": " +
                                rupiah(context.raw);
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        callback: function(value) {
                            return rupiah(value);
                        }
                    }
                }
            }
        }
    });
}


// ========================================
// ANGGOTA
// ========================================

async function loadAnggota() {

    appContent.innerHTML = `

        <div class="loading">

            Memuat data anggota...

        </div>

    `;


    try {

        const data =
            await api("anggota");


        renderAnggota(data);


    } catch (error) {

        console.error(error);


        appContent.innerHTML = `

            <div class="error">

                <h2>
                    Gagal mengambil data anggota
                </h2>

                <p>
                    ${error.message}
                </p>

            </div>

        `;

    }

}


// ========================================
// RENDER ANGGOTA
// ========================================

function renderAnggota(data) {

    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h2>
                    Data Anggota
                </h2>

                <p>
                    Daftar anggota KSPM
                    periode 2025/2026
                </p>

            </div>

        </div>


        <div class="toolbar">

            <input
                type="text"
                id="searchAnggota"
                placeholder="Cari NIM atau nama..."
            >


            <select id="filterStatus">

                <option value="Semua">
                    Semua Status
                </option>

                <option value="Aktif">
                    Aktif
                </option>

                <option value="NonAktif">
                    NonAktif
                </option>

            </select>


            <select id="filterDivisi">

                <option value="Semua">
                    Semua Divisi
                </option>

                <option value="Pengurus Inti">
                    Pengurus Inti
                </option>

                <option value="Edukasi">
                    Edukasi
                </option>

                <option value="Investment">
                    Investment
                </option>

                <option value="SDM">
                    SDM
                </option>

                <option value="Sosial Media">
                    Sosial Media
                </option>

                <option value="Partnership">
                    Partnership
                </option>

            </select>

        </div>


        <div class="panel">

            <div class="table-container">

                <table>

                    <thead>

                        <tr>

                            <th>NIM</th>

                            <th>Nama</th>

                            <th>Jabatan</th>

                            <th>Divisi</th>

                            <th>Periode</th>

                            <th>Status</th>

                        </tr>

                    </thead>


                    <tbody id="anggotaTable">

                    </tbody>

                </table>

            </div>

        </div>

    `;


    tampilkanTabelAnggota(data);


    document
        .getElementById("searchAnggota")
        .addEventListener(
            "input",
            function () {

                filterAnggota(data);

            }
        );


    document
        .getElementById("filterStatus")
        .addEventListener(
            "change",
            function () {

                filterAnggota(data);

            }
        );


    document
        .getElementById("filterDivisi")
        .addEventListener(
            "change",
            function () {

                filterAnggota(data);

            }
        );

}


// ========================================
// TAMPILKAN TABEL
// ========================================

function tampilkanTabelAnggota(data) {

    const tbody =
        document.getElementById(
            "anggotaTable"
        );


    tbody.innerHTML = "";


    if (!data || data.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="text-align:center;"
                >

                    Tidak ada data anggota.

                </td>

            </tr>

        `;

        return;

    }


    data.forEach(function (anggota) {

        const tr =
            document.createElement("tr");


        const status =
            String(
                anggota["Status"] || ""
            ).trim();


        let statusClass =
            "status-inactive";


        if (
            status.toLowerCase()
            === "aktif"
        ) {

            statusClass =
                "status-active";

        }


        tr.innerHTML = `

            <td>
                ${anggota["NIM"] || "-"}
            </td>


            <td>

                <strong>
                    ${anggota["Nama"] || "-"}
                </strong>

            </td>


            <td>
                ${anggota["Jabatan"] || "-"}
            </td>


            <td>
                ${anggota["Divisi"] || "-"}
            </td>


            <td>
                ${anggota["Periode"] || "-"}
            </td>


            <td>

                <span
                    class="status-badge ${statusClass}"
                >

                    ${status || "-"}

                </span>

            </td>

        `;


        tbody.appendChild(tr);

    });

}


// ========================================
// FILTER ANGGOTA
// ========================================

function filterAnggota(data) {

    const search =
        document
            .getElementById(
                "searchAnggota"
            )
            .value
            .toLowerCase();


    const status =
        document
            .getElementById(
                "filterStatus"
            )
            .value;


    const divisi =
        document
            .getElementById(
                "filterDivisi"
            )
            .value;


    const hasil =
        data.filter(function (anggota) {

            const nim =
                String(
                    anggota["NIM"] || ""
                ).toLowerCase();


            const nama =
                String(
                    anggota["Nama"] || ""
                ).toLowerCase();


            const statusAnggota =
                String(
                    anggota["Status"] || ""
                );


            const divisiAnggota =
                String(
                    anggota["Divisi"] || ""
                );


            const cocokSearch =

                nim.includes(search) ||

                nama.includes(search);


            const cocokStatus =

                status === "Semua" ||

                statusAnggota === status;


            const cocokDivisi =

                divisi === "Semua" ||

                divisiAnggota === divisi;


            return (

                cocokSearch &&

                cocokStatus &&

                cocokDivisi

            );

        });


    tampilkanTabelAnggota(hasil);

}


// ========================================
// LOAD TRANSAKSI
// ========================================

async function loadTransaksi() {

    appContent.innerHTML = `
        <div class="loading">
            Memuat data transaksi...
        </div>
    `;

    try {

        const data = await api("transaksi");

        renderTransaksi(data);

    } catch (error) {

        console.error(error);

        appContent.innerHTML = `
            <div class="error">
                <h2>Gagal mengambil data transaksi</h2>
                <p>${error.message}</p>
            </div>
        `;

    }

}


// ========================================
// RENDER TRANSAKSI
// ========================================

function renderTransaksi(data) {

    const isBendahara = currentUser && currentUser.role === "bendahara";

    appContent.innerHTML = `

        <div class="page-header">

            <div>
                <h2>Data Transaksi</h2>

                <p>
                    Pemasukan dan pengeluaran
                    keuangan KSPM
                </p>
            </div>

            ${isBendahara ? `
                <button
                    class="btn-primary"
                    id="btnTambahTransaksi"
                >
                    + Tambah Transaksi
                </button>
            ` : ""}

        </div>


        <div class="toolbar">

            <input
                type="text"
                id="searchTransaksi"
                placeholder="Cari ID, NIM, nama..."
            >


            <select id="filterJenis">

                <option value="Semua">
                    Semua Jenis
                </option>

                <option value="Pemasukan">
                    Pemasukan
                </option>

                <option value="Pengeluaran">
                    Pengeluaran
                </option>

            </select>


            <select id="filterKategori">

                <option value="Semua">
                    Semua Kategori
                </option>

                <option value="Kas Anggota">
                    Kas Anggota
                </option>

                <option value="Iuran Makrab">
                    Iuran Makrab
                </option>

                <option value="Lainnya">
                    Lainnya
                </option>

            </select>

        </div>


        <div class="panel">

            <div class="table-container">

                <table>

                    <thead>

                        <tr>

                            <th>ID Transaksi</th>
                            <th>Tanggal</th>
                            <th>NIM</th>
                            <th>Nama</th>
                            <th>Jenis</th>
                            <th>Kategori</th>
                            <th>Nominal</th>
                            <th>Rekening</th>
                            <th>Keterangan</th>
                            <th>Aksi</th>

                        </tr>

                    </thead>

                    <tbody id="transaksiTable">

                    </tbody>

                </table>

            </div>

        </div>

    `;


    tampilkanTabelTransaksi(data);


    // ========================================
    // TOMBOL TAMBAH
    // ========================================

    const btnTambah =
        document.getElementById(
            "btnTambahTransaksi"
        );


    if (btnTambah) {

        btnTambah.addEventListener(
            "click",
            function () {

                tampilkanFormTransaksi();

            }
        );

    }


    // ========================================
    // SEARCH
    // ========================================

    const search =
        document.getElementById(
            "searchTransaksi"
        );


    if (search) {

        search.addEventListener(
            "input",
            function () {

                filterTransaksi(data);

            }
        );

    }


    // ========================================
    // FILTER JENIS
    // ========================================

    const filterJenis =
        document.getElementById(
            "filterJenis"
        );


    if (filterJenis) {

        filterJenis.addEventListener(
            "change",
            function () {

                filterTransaksi(data);

            }
        );

    }


    // ========================================
    // FILTER KATEGORI
    // ========================================

    const filterKategori =
        document.getElementById(
            "filterKategori"
        );


    if (filterKategori) {

        filterKategori.addEventListener(
            "change",
            function () {

                filterTransaksi(data);

            }
        );

    }

}

function formatTanggal(tanggal) {
    if (!tanggal) return "-";

    const nilai = String(tanggal).trim();

    // YYYY-MM-DD
    const match = nilai.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
        const tahun = match[1];
        const bulan = match[2];
        const hari = match[3];

        return `${hari}/${bulan}/${tahun}`;
    }

    // DD/MM/YYYY
    const matchIndonesia = nilai.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

    if (matchIndonesia) {
        return nilai.substring(0, 10);
    }

    return nilai;
}

// ========================================
// TAMPILKAN TABEL
// ========================================

function tampilkanTabelTransaksi(data) {


    const isBendahara = currentUser && currentUser.role === "bendahara";

    const tbody =
        document.getElementById(
            "transaksiTable"
        );


    if (!tbody) return;


    tbody.innerHTML = "";


    if (
        !data ||
        data.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    style="text-align:center;"
                >
                    Belum ada transaksi.
                </td>

            </tr>

        `;

        return;

    }


    data.forEach(
        function (transaksi) {

            const tr =
                document.createElement(
                    "tr"
                );


            const jenis =
                String(
                    transaksi[
                        "Jenis Transaksi"
                    ] || ""
                ).trim();


            const nominal =
                Number(
                    String(
                        transaksi[
                            "Nominal"
                        ] || 0
                    ).replace(
                        /[^\d]/g,
                        ""
                    )
                );


            tr.innerHTML = `

                <td>
                    ${
                        transaksi[
                            "ID Transaksi"
                        ] || "-"
                    }
                </td>


               <td>
                    ${
                        formatTanggal(transaksi["Tanggal"])
                    }
                </td>


                <td>
                    ${
                        transaksi[
                            "Nim"
                        ] || "-"
                    }
                </td>


                <td>
                    ${
                        transaksi[
                            "Nama"
                        ] || "-"
                    }
                </td>


                <td>

                    <span
                        class="status-badge
                        ${
                            jenis === "Pemasukan"
                            ? "status-active"
                            : "status-inactive"
                        }"
                    >

                        ${
                            jenis || "-"
                        }

                    </span>

                </td>


                <td>
                    ${
                        transaksi[
                            "Kategori"
                        ] || "-"
                    }
                </td>


                <td>
                    ${rupiah(nominal)}
                </td>


                <td>
                    ${
                        transaksi[
                            "Rekening"
                        ] || "-"
                    }
                </td>


                <td>
                    ${
                        transaksi[
                            "Keterangan"
                        ] || "-"
                    }
                </td>

                <td>

                ${isBendahara ? `
                    <button
                        class="btn-delete"
                        onclick="
                            hapusTransaksi(
                                '${transaksi["ID Transaksi"]}'
                            )
                        "
                    >
                        Hapus
                    </button>
                ` : ""}    

                </td>

            `;

            tbody.appendChild(tr);

        }
    );

}


// ========================================
// FILTER TRANSAKSI
// ========================================

function filterTransaksi(data) {

    const searchInput =
        document.getElementById(
            "searchTransaksi"
        );


    const jenisInput =
        document.getElementById(
            "filterJenis"
        );


    const kategoriInput =
        document.getElementById(
            "filterKategori"
        );


    const search =
        searchInput
        ? searchInput.value.toLowerCase()
        : "";


    const jenis =
        jenisInput
        ? jenisInput.value
        : "Semua";


    const kategori =
        kategoriInput
        ? kategoriInput.value
        : "Semua";


    const hasil =
        data.filter(
            function (transaksi) {

                const id =
                    String(
                        transaksi[
                            "ID Transaksi"
                        ] || ""
                    ).toLowerCase();


                const nim =
                    String(
                        transaksi[
                            "Nim"
                        ] || ""
                    ).toLowerCase();


                const nama =
                    String(
                        transaksi[
                            "Nama"
                        ] || ""
                    ).toLowerCase();


                const jenisTransaksi =
                    String(
                        transaksi[
                            "Jenis Transaksi"
                        ] || ""
                    );


                const kategoriTransaksi =
                    String(
                        transaksi[
                            "Kategori"
                        ] || ""
                    );


                const cocokSearch =

                    id.includes(search) ||

                    nim.includes(search) ||

                    nama.includes(search);


                const cocokJenis =

                    jenis === "Semua" ||

                    jenisTransaksi === jenis;


                const cocokKategori =

                    kategori === "Semua" ||

                    kategoriTransaksi === kategori;


                return (

                    cocokSearch &&

                    cocokJenis &&

                    cocokKategori

                );

            }
        );


    tampilkanTabelTransaksi(
        hasil
    );

}


// ========================================
// CHANGE PAGE
// ========================================

// ========================================
// CHANGE PAGE
// ========================================

function changePage(page) {

    const data = pages[page];

    if (!data) {
        console.error(
            "Halaman tidak ditemukan:",
            page
        );
        return;
    }

    pageTitle.textContent =
        data.title;

    pageDescription.textContent =
        data.description;


    // DASHBOARD
    if (page === "dashboard") {

        loadDashboard();

    }


    // ANGGOTA
    else if (page === "anggota") {

        loadAnggota();

    }


    // KAS
    else if (page === "kas") {

        loadKas();

    }


    // TRANSAKSI
    else if (page === "transaksi") {

        loadTransaksi();

    }


    // URAN MAKRAB
    else if (page === "uranMakrab") {

        loadUranMakrab();

    }

    else if (page === "lepkeu") {

        loadLepkeu();
    }

    // HALAMAN LAIN
    else {

        appContent.innerHTML = `

            <div class="empty-page">

                <h2>
                    ${data.title}
                </h2>

                <p>
                    Halaman ini akan kita
                    bangun berikutnya.
                </p>

            </div>

        `;

    }

}

// ========================================
// EVENT MENU
// ========================================

menuItems.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {


                menuItems.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                this.classList.add(
                    "active"
                );


                changePage(
                    this.dataset.page
                );

            }
        );

    }
);
// ========================================
// FORM TAMBAH TRANSAKSI
// ========================================

function tampilkanFormTransaksi() {

    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h2>
                    Tambah Transaksi
                </h2>

                <p>
                    Tambahkan transaksi baru
                </p>

            </div>

        </div>


        <div class="panel form-panel">

            <form id="formTransaksi">


                <div class="form-grid">


                    <div class="form-group">

                        <label>
                            Tanggal
                        </label>

                        <input
                            type="date"
                            id="tanggal"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            NIM
                        </label>

                        <input
                            type="text"
                            id="nim"
                            placeholder="NIM otomatis"
                            readonly
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Nama Anggota
                        </label>

                        <select id = "nama">

                            <option value="">
                                Pilih anggota
                            </option>

                        </select> 
                

                    </div>


                    <div class="form-group">

                        <label>
                            Jenis Transaksi
                        </label>

                        <select
                            id="jenis"
                            required
                        >

                            <option value="">
                                Pilih jenis
                            </option>

                            <option value="Pemasukan">
                                Pemasukan
                            </option>

                            <option value="Pengeluaran">
                                Pengeluaran
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Kategori
                        </label>

                        <select
                            id="kategori"
                            required
                        >

                            <option value="">
                                Pilih kategori
                            </option>

                            <option value="Kas Anggota">
                                Kas Anggota
                            </option>

                            <option value="Iuran Makrab">
                                Iuran Makrab
                            </option>

                            <option value="Lainnya">
                                Lainnya
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Nominal
                        </label>

                        <input
                            type="number"
                            id="nominal"
                            min="0"
                            placeholder="Contoh: 30000"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Rekening
                        </label>

                        <select
                            id="rekening"
                            required
                        >

                            <option value="">
                                Pilih rekening
                            </option>

                            <option value="Rekening Bendahara 1">
                                Rekening Bendahara 1
                            </option>

                            <option value="Rekening Bendahara 2">
                                Rekening Bendahara 2
                            </option>

                        </select>

                    </div>

                    <div
                        class="form-group full"
                    >

                        <label>
                            Keterangan
                        </label>

                        <textarea
                            id="keterangan"
                            rows="4"
                            placeholder="Keterangan transaksi..."
                        ></textarea>

                    </div>


                </div>


                <div class="form-actions">

                    <button
                        type="button"
                        class="btn-secondary"
                        id="btnBatalTransaksi"
                    >
                        Batal
                    </button>


                    <button
                        type="submit"
                        class="btn-primary"
                    >
                        Simpan Transaksi
                    </button>

                </div>


            </form>

        </div>

    `;

    loadDaftarAnggotaTransaksi();


    document.getElementById("btnBatalTransaksi").addEventListener( "click",function () {loadTransaksi(); });

    document
    .getElementById("nama")
    .addEventListener(
        "change",
        function () {

            const selectedOption =
                this.options[
                    this.selectedIndex
                ];

            const nim =
                selectedOption.dataset.nim || "";

            document.getElementById(
                "nim"
            ).value = nim;

        }
    );

    document.getElementById("formTransaksi").addEventListener("submit",simpanTransaksi);



}

// ========================================
// DAFTAR ANGGOTA UNTUK TRANSAKSI
// ========================================

async function loadDaftarAnggotaTransaksi() {

    const namaSelect = document.getElementById("nama");

    if (!namaSelect) return;

    // Tampilkan loading
    namaSelect.innerHTML = `
        <option value="">
            Memuat daftar anggota...
        </option>
    `;

    try {

        const data = await api("anggota");

        console.log("Data anggota:", data);

        // Reset dropdown
        namaSelect.innerHTML = `
            <option value="">
                Pilih anggota
            </option>
        `;

        if (!data || data.length === 0) {

            namaSelect.innerHTML = `
                <option value="">
                    Tidak ada data anggota
                </option>
            `;

            return;
        }

        data.forEach(function (anggota) {

            const nama =
                String(anggota["Nama"] || "").trim();

            const nim =
                String(anggota["NIM"] || "").trim();

            const status =
                String(anggota["Status"] || "")
                    .trim()
                    .toLowerCase();

            // Lewati kalau nama atau NIM kosong
            if (!nama || !nim) {
                return;
            }

            // Hanya anggota aktif
            if (status !== "aktif") {
                return;
            }

            const option =
                document.createElement("option");

            // VALUE = NAMA
            option.value = nama;

            // Yang tampil
            option.textContent = nama;

            // Simpan NIM
            option.dataset.nim = nim;

            namaSelect.appendChild(option);

        });

        console.log(
            "Jumlah anggota di dropdown:",
            namaSelect.options.length - 1
        );

    } catch (error) {

        console.error(
            "Gagal mengambil daftar anggota:",
            error
        );

        namaSelect.innerHTML = `
            <option value="">
                Gagal mengambil anggota
            </option>
        `;

    }


}

// ========================================
// SIMPAN TRANSAKSI
// ========================================

async function simpanTransaksi(event) {

    event.preventDefault();

    const kategori =
    document.getElementById(
        "kategori"
    ).value;


    const nim =
        document.getElementById(
            "nim"
        ).value.trim();


    const nama =
        document.getElementById(
            "nama"
        ).value.trim();


    if ((kategori === "Kas Anggota" || kategori === "Iuran Makrab") && (!nim || !nama)) {

        alert(
            "Untuk Kas Anggota dan Iuran Makrab, Nama dan NIM wajib dipilih."
        );

        return;
    }


    const transaksi = {

        tanggal:
            document.getElementById(
                "tanggal"
            ).value,

        nim: nim,

        nama: nama,

        jenis:
            document.getElementById(
                "jenis"
            ).value,

        kategori: kategori,

        nominal:
            document.getElementById(
                "nominal"
            ).value,

        rekening:
            document.getElementById(
                "rekening"
            ).value,

        keterangan:
            document.getElementById(
                "keterangan"
            ).value

    };


    try {

        const response =
            await fetch(API_URL, {

                method: "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body: JSON.stringify({

                    action: "tambahTransaksi",
                    token: sessionToken,

                    transaksi: transaksi

                })

            });


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.error ||
                "Gagal menyimpan transaksi"
            );

        }


        alert(
            "Transaksi berhasil disimpan."
        );
        tampilkanHalamanTransaksi();


    } catch (error) {

        console.error(error);


        alert(
            "Gagal menyimpan transaksi: "
            + error.message
        );

    }

}

// ========================================
// HAPUS TRANSAKSI
// ========================================

async function hapusTransaksi(idTransaksi) {

    const yakin =
        confirm(
            `Yakin ingin menghapus transaksi ${idTransaksi}?`
        );


    if (!yakin) return;
        console.log("id yang dihapus : ", idTransaksi );

    try {

        const response =
            await fetch(API_URL, {

                method: "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body: JSON.stringify({

                    action: "hapusTransaksi",
                    token: sessionToken,

                    idTransaksi: idTransaksi

                })

            });


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.error ||
                "Gagal menghapus transaksi"
            );

        }


        alert(
            "Transaksi berhasil dihapus."
        );


        loadTransaksi();


    } catch (error) {

        console.error(error);


        alert(
            "Gagal menghapus transaksi: "
            + error.message
        );

    }

}

function tampilkanHalamanTransaksi() {
    changePage("transaksi");
}


// ========================================
// KAS ANGGOTA
// ========================================

let dataKas = [];


// ========================================
// LOAD KAS
// ========================================

async function loadKas() {

    console.log("=== LOAD KAS DIPANGGIL ===");

    appContent.innerHTML = `
        <div class="loading">
            Memuat data kas anggota...
        </div>
    `;

    try {

        console.log("=== SEBELUM API KAS ===");

        const data = await api("kas");

        console.log("=== SESUDAH API KAS ===");
        console.log("DATA KAS:", data);
        console.log("JUMLAH DATA KAS:", data ? data.length : 0);

        dataKas = Array.isArray(data) ? data : [];

        renderKas(dataKas);

    } catch (error) {

        console.error(
            "Gagal mengambil data KAS:",
            error
        );

        appContent.innerHTML = `
            <div class="error">

                <h2>
                    Gagal mengambil data kas
                </h2>

                <p>
                    ${error.message}
                </p>

            </div>
        `;

    }

}


// ========================================
// RENDER KAS
// ========================================

function renderKas(data) {

    appContent.innerHTML = `

        <div class="page-header">

            <div>

                <h2>
                    Kas Anggota
                </h2>

                <p>
                    Monitoring pembayaran iuran kas anggota tahun 2026.
                </p>

            </div>

            <button
                type="button"
                class="btn-primary"
                id="btnRefreshKas"
            >
                🔄 Refresh
            </button>

        </div>


        <!-- SUMMARY -->

        <div class="summary-grid">

            <div class="summary-card">

                <div class="summary-label">
                    Anggota
                </div>

                <div
                    class="summary-value"
                    id="kasJumlahAnggota"
                >
                    0
                </div>

            </div>


            <div class="summary-card">

                <div class="summary-label">
                    Total Kewajiban
                </div>

                <div
                    class="summary-value"
                    id="kasTotalKewajiban"
                >
                    Rp0
                </div>

            </div>


            <div class="summary-card">

                <div class="summary-label">
                    Total Dibayar
                </div>

                <div
                    class="summary-value"
                    id="kasTotalDibayar"
                >
                    Rp0
                </div>

            </div>


            <div class="summary-card">

                <div class="summary-label">
                    Total Tunggakan
                </div>

                <div
                    class="summary-value"
                    id="kasTotalTunggakan"
                >
                    Rp0
                </div>

            </div>

        </div>


        <!-- SEARCH -->

        <div class="kas-toolbar">

            <input
                type="text"
                id="searchKas"
                placeholder="Cari NIM atau nama anggota..."
            >

        </div>


        <!-- TABLE -->

        <div class="panel">

            <div class="table-container">

                <table id="tabelKas">

                    <thead>

                        <tr>

                            <th>NIM</th>
                            <th>NAMA</th>
                            <th>STATUS</th>

                            <th>JANUARI 2026</th>
                            <th>FEBRUARI 2026</th>
                            <th>MARET 2026</th>
                            <th>APRIL 2026</th>
                            <th>MEI 2026</th>
                            <th>JUNI 2026</th>
                            <th>JULI 2026</th>
                            <th>AGUSTUS 2026</th>
                            <th>SEPTEMBER 2026</th>
                            <th>OKTOBER 2026</th>
                            <th>NOVEMBER 2026</th>
                            <th>DESEMBER 2026</th>

                            <th>TOTAL DIBAYAR</th>
                            <th>TOTAL KEWAJIBAN</th>
                            <th>TUNGGAKAN</th>

                        </tr>

                    </thead>


                    <tbody id="kasTableBody">

                    </tbody>

                </table>

            </div>

        </div>

    `;


    // Tampilkan tabel
    tampilkanTabelKas(data);


    // Update summary
    updateKasSummary(data);


    // Refresh
    const btnRefresh =
        document.getElementById("btnRefreshKas");

    if (btnRefresh) {

        btnRefresh.addEventListener(
            "click",
            loadKas
        );

    }


    // Search
    const search =
        document.getElementById("searchKas");

    if (search) {

        search.addEventListener(
            "input",
            filterKas
        );

    }

}


// ========================================
// TAMPILKAN TABEL KAS
// ========================================

function tampilkanTabelKas(data) {

    const tbody =
        document.getElementById("kasTableBody");


    if (!tbody) {

        console.error(
            "kasTableBody tidak ditemukan!"
        );

        return;

    }


    tbody.innerHTML = "";


    if (!data || data.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="18"
                    style="text-align:center;"
                >
                    Tidak ada data anggota.
                </td>

            </tr>

        `;

        return;

    }


    data.forEach(function (mahasiswa) {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>
                ${mahasiswa["Nim"] || "-"}
            </td>

            <td>
                <strong>
                    ${mahasiswa["Nama"] || "-"}
                </strong>
            </td>

            <td>
                ${mahasiswa["Status"] || "-"}
            </td>


            <td>
                ${rupiah(mahasiswa["Januari"])}
            </td>

            <td>
                ${rupiah(mahasiswa["Februari"])}
            </td>

            <td>
                ${rupiah(mahasiswa["Maret"])}
            </td>

            <td>
                ${rupiah(mahasiswa["April"])}
            </td>

            <td>
                ${rupiah(mahasiswa["Mei"])}
            </td>

            <td>
                ${rupiah(mahasiswa["Juni"])}
            </td>

            <td>
                ${rupiah(mahasiswa["Juli"])}
            </td>

            <td>
                ${rupiah(mahasiswa["Agustus"])}
            </td>

            <td>
                ${rupiah(mahasiswa["September"])}
            </td>

            <td>
                ${rupiah(mahasiswa["Oktober"])}
            </td>

            <td>
                ${rupiah(mahasiswa["November"])}
            </td>

            <td>
                ${rupiah(mahasiswa["Desember"])}
            </td>


            <td>
                ${rupiah(mahasiswa["Total Dibayar"])}
            </td>

            <td>
                ${rupiah(mahasiswa["Total Kewajiban"])}
            </td>

            <td>
                ${rupiah(mahasiswa["Tunggakan"])}
            </td>

        `;


        tbody.appendChild(tr);

    });


    console.log(
        "Jumlah anggota yang ditampilkan:",
        tbody.rows.length
    );

}


// ========================================
// SUMMARY KAS
// ========================================

function updateKasSummary(data) {

    const jumlahAnggota =
        data.length;


    const totalKewajiban =
        data.reduce(
            function(total, mahasiswa) {

                return total +
                    Number(
                        mahasiswa["Total Kewajiban"] || 0
                    );

            },
            0
        );


    const totalDibayar =
        data.reduce(
            function(total, mahasiswa) {

                return total +
                    Number(
                        mahasiswa["Total Dibayar"] || 0
                    );

            },
            0
        );


    const totalTunggakan =
        data.reduce(
            function(total, mahasiswa) {

                return total +
                    Number(
                        mahasiswa["Tunggakan"] || 0
                    );

            },
            0
        );


    const jumlahElement =
        document.getElementById(
            "kasJumlahAnggota"
        );


    const kewajibanElement =
        document.getElementById(
            "kasTotalKewajiban"
        );


    const dibayarElement =
        document.getElementById(
            "kasTotalDibayar"
        );


    const tunggakanElement =
        document.getElementById(
            "kasTotalTunggakan"
        );


    if (jumlahElement) {

        jumlahElement.textContent =
            jumlahAnggota;

    }


    if (kewajibanElement) {

        kewajibanElement.textContent =
            rupiah(totalKewajiban);

    }


    if (dibayarElement) {

        dibayarElement.textContent =
            rupiah(totalDibayar);

    }


    if (tunggakanElement) {

        tunggakanElement.textContent =
            rupiah(totalTunggakan);

    }

}


// ========================================
// FILTER KAS
// ========================================

function filterKas() {

    const input =
        document.getElementById(
            "searchKas"
        );


    if (!input) return;


    const keyword =
        input.value
            .toLowerCase()
            .trim();


    const hasil =
        dataKas.filter(
            function(mahasiswa) {

                const nim =
                    String(
                        mahasiswa["Nim"] || ""
                    ).toLowerCase();


                const nama =
                    String(
                        mahasiswa["Nama"] || ""
                    ).toLowerCase();


                return (
                    nim.includes(keyword) ||
                    nama.includes(keyword)
                );

            }
        );


    tampilkanTabelKas(hasil);

    updateKasSummary(hasil);

}

let dataUranMakrab = [];

async function loadUranMakrab() {

    appContent.innerHTML = `
        <div class="loading">
            Memuat data Uran Makrab...
        </div>
    `;

    try {

        const data = await api("uranMakrab");

        console.log("DATA URAN MAKRAB:", data);

        dataUranMakrab = data;

        renderUranMakrab(data);

    } catch (error) {

        console.error("Gagal memuat Uran Makrab:", error);

        appContent.innerHTML = `
            <div class="error">
                <h3>Gagal memuat data</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}


function renderUranMakrab(data) {

    appContent.innerHTML = `
        <div class="page-header">
            <div>
                <h1>Uran Makrab</h1>
                <p>Monitoring pembayaran iuran wajib Makrab anggota</p>
            </div>

            <button id="btnRefreshMakrab" class="btn-primary">
                ↻ Refresh
            </button>
        </div>

        <div class="summary-grid">

            <div class="summary-card">
                <div class="summary-title">
                    Anggota Aktif
                </div>
                <div class="summary-value" id="totalAnggotaMakrab">
                    0
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-title">
                    Total Tagihan
                </div>
                <div class="summary-value" id="totalTagihanMakrab">
                    Rp0
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-title">
                    Total Dibayar
                </div>
                <div class="summary-value" id="totalDibayarMakrab">
                    Rp0
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-title">
                    Sisa Tagihan
                </div>
                <div class="summary-value" id="totalSisaMakrab">
                    Rp0
                </div>
            </div>

        </div>

        <div class="table-container">

            <div class="table-toolbar">

                <div>
                    <h2>Data Iuran Makrab</h2>
                </div>

                <div>
                    <input
                        type="text"
                        id="searchMakrab"
                        placeholder="Cari NIM atau nama..."
                    >
                </div>

            </div>

            <div class="table-responsive">

                <table class="data-table">

                    <thead>
                        <tr>
                            <th>NIM</th>
                            <th>Nama</th>
                            <th>Status</th>
                            <th>Iuran Wajib</th>
                            <th>Nominal Dibayar</th>
                            <th>Sisa Tagihan</th>
                            <th>Status Pembayaran</th>
                            <th>Keterangan</th>
                        </tr>
                    </thead>

                    <tbody id="uranMakrabTableBody">
                    </tbody>

                </table>

            </div>

        </div>
    `;

    tampilkanTabelUranMakrab(data);
    updateSummaryUranMakrab(data);

    document
        .getElementById("btnRefreshMakrab")
        .addEventListener("click", loadUranMakrab);

    document
        .getElementById("searchMakrab")
        .addEventListener("input", function () {
            filterUranMakrab(this.value);
        });
}

function tampilkanTabelUranMakrab(data) {

    const tbody = document.getElementById("uranMakrabTableBody");

    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-data">
                    Tidak ada data anggota.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = data.map(anggota => {

        let statusClass = "";

        if (anggota.StatusPembayaran === "Lunas") {
            statusClass = "status-lunas";
        } else if (anggota.StatusPembayaran === "Belum Bayar") {
            statusClass = "status-belum-bayar";
        } else {
            statusClass = "status-belum-lunas";
        }

        return `
            <tr>

                <td>
                    ${anggota.Nim}
                </td>

                <td>
                    ${anggota.Nama}
                </td>

                <td>
                    <span class="status ${anggota.Status.toLowerCase()}">
                        ${anggota.Status}
                    </span>
                </td>

                <td>
                    ${rupiah(anggota.IuranWajib)}
                </td>

                <td>
                    ${rupiah(anggota.NominalDibayar)}
                </td>

                <td>
                    ${rupiah(anggota.SisaTagihan)}
                </td>

                <td>
                    <span class="status ${statusClass}">
                        ${anggota.StatusPembayaran}
                    </span>
                </td>

                <td>
                    ${anggota.Keterangan || ""}
                </td>

            </tr>
        `;

    }).join("");

    console.log(
        "JUMLAH BARIS MAKRAB:",
        document.querySelectorAll("#uranMakrabTableBody tr").length
    );
}

function updateSummaryUranMakrab(data) {

    const anggotaAktif = data.filter(anggota =>
        String(anggota.Status).toLowerCase() === "aktif"
    );

    const totalTagihan = data.reduce(
        (total, anggota) =>
            total + Number(anggota.IuranWajib || 0),
        0
    );

    const totalDibayar = data.reduce(
        (total, anggota) =>
            total + Number(anggota.NominalDibayar || 0),
        0
    );

    const totalSisa = data.reduce(
        (total, anggota) =>
            total + Number(anggota.SisaTagihan || 0),
        0
    );

    document.getElementById("totalAnggotaMakrab").textContent =
        anggotaAktif.length;

    document.getElementById("totalTagihanMakrab").textContent =
        rupiah(totalTagihan);

    document.getElementById("totalDibayarMakrab").textContent =
        rupiah(totalDibayar);

    document.getElementById("totalSisaMakrab").textContent =
        rupiah(totalSisa);
}

function filterUranMakrab(keyword) {

    keyword = String(keyword || "").toLowerCase().trim();

    const hasil = dataUranMakrab.filter(anggota => {

        const nim = String(anggota.Nim || "").toLowerCase();
        const nama = String(anggota.Nama || "").toLowerCase();
        const status = String(anggota.Status || "").toLowerCase();
        const pembayaran = String(
            anggota.StatusPembayaran || ""
        ).toLowerCase();

        return (
            nim.includes(keyword) ||
            nama.includes(keyword) ||
            status.includes(keyword) ||
            pembayaran.includes(keyword)
        );
    });

    tampilkanTabelUranMakrab(hasil);
}

let dataLepkeu = null;

async function loadLepkeu() {
    appContent.innerHTML = `
        <div class="loading">
            Memuat Laporan Evaluasi Keuangan...
        </div>
    `;

    try {
        const data = await api("lepkeu");

        console.log("DATA LEPKEU:", data);

        dataLepkeu = data;

        renderLepkeu(data);

    } catch (error) {
        console.error("Gagal memuat LEPKEU:", error);

        appContent.innerHTML = `
            <div class="error-page">
                <h2>Gagal Memuat LEPKEU</h2>
                <p>${error.message}</p>

                <button onclick="loadLepkeu()">
                    Coba Lagi
                </button>
            </div>
        `;
    }
}

function renderLepkeu(data) {

    if (!data || !data.bulan) {
        appContent.innerHTML = `
            <div class="empty-page">
                <h2>Data LEPKEU Tidak Tersedia</h2>
                <p>Belum ada data laporan keuangan.</p>
            </div>
        `;
        return;
    }

    appContent.innerHTML = `
        <div class="lepkeu-container">

            <!-- HEADER -->
            <div class="page-header">
                <div>
                    <h2>Laporan Evaluasi Keuangan</h2>
                    <p>
                        Laporan pemasukan dan pengeluaran
                        periode ${data.periode}
                    </p>
                </div>

                <button class="btn-refresh"
                        onclick="loadLepkeu()">
                    ↻ Refresh
                </button>
            </div>


            <!-- RINGKASAN PERIODE -->
            <div class="summary-grid">

                <div class="summary-card">
                    <div class="summary-label">
                        Total Pemasukan
                    </div>

                    <div class="summary-value pemasukan">
                        ${rupiah(data.rekap.totalPemasukan)}
                    </div>
                </div>


                <div class="summary-card">
                    <div class="summary-label">
                        Total Pengeluaran
                    </div>

                    <div class="summary-value pengeluaran">
                        ${rupiah(data.rekap.totalPengeluaran)}
                    </div>
                </div>


                <div class="summary-card">
                    <div class="summary-label">
                        Saldo Akhir Periode
                    </div>

                    <div class="summary-value saldo">
                        ${rupiah(data.rekap.saldo)}
                    </div>
                </div>

            </div>


            <!-- REKAP BULANAN -->
            <div class="card">

                <div class="card-header">
                    <h3>Rekapitulasi Bulanan</h3>
                </div>

                <div class="table-container">

                    <table class="data-table">

                        <thead>
                            <tr>
                                <th>Bulan</th>
                                <th>Pemasukan</th>
                                <th>Pengeluaran</th>
                                <th>Saldo</th>
                            </tr>
                        </thead>

                        <tbody>

                            ${data.bulan.map(bulan => `
                                <tr>

                                    <td>
                                        <strong>
                                            ${bulan.namaBulan}
                                        </strong>
                                    </td>

                                    <td class="text-pemasukan">
                                        ${rupiah(bulan.totalPemasukan)}
                                    </td>

                                    <td class="text-pengeluaran">
                                        ${rupiah(bulan.totalPengeluaran)}
                                    </td>

                                    <td>
                                        ${rupiah(bulan.saldo)}
                                    </td>

                                </tr>
                            `).join("")}

                        </tbody>

                    </table>

                </div>

            </div>


            <!-- DETAIL TRANSAKSI -->
            <div class="lepkeu-detail">

                ${data.bulan.map(bulan => renderBulanLepkeu(bulan)).join("")}

            </div>


            <!-- REKAP AKHIR -->
            <div class="card lepkeu-total">

                <div class="card-header">
                    <h3>Rekapitulasi Periode ${data.periode}</h3>
                </div>

                <div class="periode-total-grid">

                    <div>
                        <span>Total Pemasukan</span>
                        <strong class="text-pemasukan">
                            ${rupiah(data.rekap.totalPemasukan)}
                        </strong>
                    </div>

                    <div>
                        <span>Total Pengeluaran</span>
                        <strong class="text-pengeluaran">
                            ${rupiah(data.rekap.totalPengeluaran)}
                        </strong>
                    </div>

                    <div>
                        <span>Saldo Akhir</span>
                        <strong>
                            ${rupiah(data.rekap.saldo)}
                        </strong>
                    </div>

                </div>

            </div>

        </div>
    `;
}

function renderBulanLepkeu(bulan) {

    const adaTransaksi = bulan.transaksi &&
                         bulan.transaksi.length > 0;

    return `
        <div class="card bulan-lepkeu">

            <div class="bulan-header">

                <div>
                    <h3>
                        ${bulan.namaBulan} ${dataLepkeu.periode}
                    </h3>

                    <span>
                        ${bulan.transaksi.length}
                        transaksi
                    </span>
                </div>

                <div class="bulan-summary">

                    <div>
                        <small>Pemasukan</small>
                        <strong class="text-pemasukan">
                            ${rupiah(bulan.totalPemasukan)}
                        </strong>
                    </div>

                    <div>
                        <small>Pengeluaran</small>
                        <strong class="text-pengeluaran">
                            ${rupiah(bulan.totalPengeluaran)}
                        </strong>
                    </div>

                    <div>
                        <small>Saldo</small>
                        <strong>
                            ${rupiah(bulan.saldo)}
                        </strong>
                    </div>

                </div>

            </div>


            ${
                adaTransaksi
                ?
                `
                <div class="table-container">

                    <table class="data-table">

                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Tanggal</th>
                                <th>ID Transaksi</th>
                                <th>Nama Transaksi</th>
                                <th>Kategori</th>
                                <th>Pemasukan</th>
                                <th>Pengeluaran</th>
                                <th>Rekening</th>
                                <th>Keterangan</th>
                            </tr>
                        </thead>

                        <tbody>

                            ${bulan.transaksi.map((trx, index) => `

                                <tr>

                                    <td>${index + 1}</td>

                                    <td>
                                        ${trx.tanggal}
                                    </td>

                                    <td>
                                        ${trx.idTransaksi || "-"}
                                    </td>

                                    <td>
                                        ${trx.nama || "-"}
                                    </td>

                                    <td>
                                        ${trx.kategori || "-"}
                                    </td>

                                    <td class="text-pemasukan">

                                        ${
                                            trx.jenisTransaksi === "Pemasukan"
                                            ? rupiah(trx.nominal)
                                            : "-"
                                        }

                                    </td>

                                    <td class="text-pengeluaran">

                                        ${
                                            trx.jenisTransaksi === "Pengeluaran"
                                            ? rupiah(trx.nominal)
                                            : "-"
                                        }

                                    </td>

                                    <td>
                                        ${trx.rekening || "-"}
                                    </td>

                                    <td>
                                        ${trx.keterangan || "-"}
                                    </td>

                                </tr>

                            `).join("")}

                        </tbody>

                    </table>

                </div>
                `
                :
                `
                <div class="empty-month">

                    <p>
                        Tidak ada transaksi pada
                        ${bulan.namaBulan}.
                    </p>

                </div>
                `
            }

        </div>
    `;
}

function parseTanggalIndonesia(tanggal) {

    if (!tanggal) return new Date(0);

    const bagian =
        String(tanggal).split("/");

    if (bagian.length !== 3) {
        return new Date(tanggal);
    }

    const hari =
        Number(bagian[0]);

    const bulan =
        Number(bagian[1]) - 1;

    const tahun =
        Number(bagian[2]);

    return new Date(
        tahun,
        bulan,
        hari
    );

}


