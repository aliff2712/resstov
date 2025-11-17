<?php
header('Content-Type: application/json; charset=utf-8');

// Koneksi
$koneksi = new mysqli("localhost", "root", "", "e_foddie");
if ($koneksi->connect_error) {
  echo json_encode(["status" => "error", "message" => "Koneksi gagal: " . $koneksi->connect_error]);
  exit;
}

// Ambil JSON dari request
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!$data) {
  echo json_encode(["status" => "error", "message" => "Format JSON tidak valid"]);
  exit;
}

// Ambil & sanitasi (sederhana)
$nama = isset($data['nama_pemesan']) ? $data['nama_pemesan'] : '';
$metode = isset($data['metode']) ? $data['metode'] : '';
$total = isset($data['total']) ? intval($data['total']) : 0;
$uang = isset($data['uang']) ? intval($data['uang']) : 0;
$kembalian = isset($data['kembalian']) ? intval($data['kembalian']) : 0;
$opsiAntar = isset($data['opsiAntar']) ? $data['opsiAntar'] : '';
$alamat = isset($data['alamat']) ? $data['alamat'] : '';
$waktu = isset($data['waktu']) ? $data['waktu'] : '';

// Prepare insert pesanan (8 kolom, 8 placeholder)
$stmt = $koneksi->prepare("INSERT INTO pesanan (nama_pemesan, metode, total, uang_dibayar, kembalian, opsi_antar, alamat, waktu) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
if (!$stmt) {
  echo json_encode(["status" => "error", "message" => "Prepare gagal: " . $koneksi->error]);
  exit;
}

// tipe: s (nama), s (metode), i (total), i (uang), i (kembalian), s (opsiAntar), s (alamat), s (waktu)
$stmt->bind_param("ssiiisss", $nama, $metode, $total, $uang, $kembalian, $opsiAntar, $alamat, $waktu);
$exec = $stmt->execute();
if (!$exec) {
  echo json_encode(["status" => "error", "message" => "Eksekusi gagal: " . $stmt->error]);
  exit;
}

$id_pesanan = $stmt->insert_id;
$stmt->close();

// Simpan detail_pesanan
if (!empty($data['items']) && is_array($data['items'])) {
  $stmt2 = $koneksi->prepare("INSERT INTO detail_pesanan (id_pesanan, nama_menu, jumlah, subtotal) VALUES (?, ?, ?, ?)");
  if ($stmt2) {
    foreach ($data['items'] as $item) {
      $nama_menu = isset($item['nama']) ? $item['nama'] : '';
      $jumlah = isset($item['jumlah']) ? intval($item['jumlah']) : 0;
      $subtotal = isset($item['subtotal']) ? intval($item['subtotal']) : 0;
      $stmt2->bind_param("isii", $id_pesanan, $nama_menu, $jumlah, $subtotal);
      $stmt2->execute();
    }
    $stmt2->close();
  } else {
    // log, tapi jangan blokir karena pesanan sudah tersimpan
    // error_log("Prepare detail gagal: " . $koneksi->error);
  }
}

echo json_encode(["status" => "success", "id_pesanan" => $id_pesanan]);
$koneksi->close();
