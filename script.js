document.addEventListener('DOMContentLoaded', () => {
    const roomImages = document.querySelectorAll('.room-image');
    const roomSelect = document.getElementById('room');
    const reservationForm = document.getElementById('reservationForm');
    const reservationsContainer = document.getElementById('reservations');
    
    // ローカルストレージから予約データを読み込む
    let reservations = JSON.parse(localStorage.getItem('reservations')) || [];
    
    // 会議室画像のクリックイベント
    roomImages.forEach(image => {
        image.addEventListener('click', () => {
            // 選択状態の切り替え
            roomImages.forEach(img => img.classList.remove('selected'));
            image.classList.add('selected');
            
            // フォームの会議室選択を更新
            const room = image.dataset.room;
            roomSelect.value = room;
        });
    });
    
    // 予約フォームの送信処理
    reservationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(reservationForm);
        const reservation = {
            room: formData.get('room'),
            startTime: formData.get('startTime'),
            endTime: formData.get('endTime'),
            name: formData.get('name'),
            id: Date.now() // 一意のIDとして現在のタイムスタンプを使用
        };
        
        // 予約の重複チェック
        if (isReservationOverlapping(reservation)) {
            alert('選択された時間帯は既に予約が入っています。');
            return;
        }
        
        // 予約データの保存
        reservations.push(reservation);
        localStorage.setItem('reservations', JSON.stringify(reservations));
        
        // 予約一覧の更新
        updateReservationList();
        
        // CSVファイルのダウンロード
        downloadReservationsCSV();
        
        // フォームのリセット
        reservationForm.reset();
        roomImages.forEach(img => img.classList.remove('selected'));
        
        alert('予約が完了しました。');
    });
    
    // 予約の重複チェック
    function isReservationOverlapping(newReservation) {
        return reservations.some(reservation => {
            if (reservation.room !== newReservation.room) return false;
            
            const newStart = new Date(newReservation.startTime);
            const newEnd = new Date(newReservation.endTime);
            const existingStart = new Date(reservation.startTime);
            const existingEnd = new Date(reservation.endTime);
            
            return (newStart < existingEnd && newEnd > existingStart);
        });
    }
    
    // 予約一覧の更新
    function updateReservationList() {
        reservationsContainer.innerHTML = '';
        
        if (reservations.length === 0) {
            reservationsContainer.innerHTML = '<p>予約はありません。</p>';
            return;
        }
        
        // 予約を日時でソート
        reservations.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        
        reservations.forEach(reservation => {
            const reservationElement = document.createElement('div');
            reservationElement.className = 'reservation-item';
            reservationElement.innerHTML = `
                <p><strong>会議室:</strong> ${reservation.room}</p>
                <p><strong>開始時間:</strong> ${formatDateTime(reservation.startTime)}</p>
                <p><strong>終了時間:</strong> ${formatDateTime(reservation.endTime)}</p>
                <p><strong>予約者:</strong> ${reservation.name}</p>
                <button onclick="deleteReservation(${reservation.id})" class="delete-button">削除</button>
            `;
            reservationsContainer.appendChild(reservationElement);
        });
    }
    
    // 日時のフォーマット
    function formatDateTime(dateTimeStr) {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // 予約の削除
    window.deleteReservation = (id) => {
        if (confirm('この予約を削除してもよろしいですか？')) {
            reservations = reservations.filter(reservation => reservation.id !== id);
            localStorage.setItem('reservations', JSON.stringify(reservations));
            updateReservationList();
            downloadReservationsCSV();
        }
    };
    
    // CSVファイルのダウンロード
    function downloadReservationsCSV() {
        const headers = ['会議室', '開始時間', '終了時間', '予約者名'];
        const csvContent = [
            headers.join(','),
            ...reservations.map(reservation => [
                reservation.room,
                formatDateTime(reservation.startTime),
                formatDateTime(reservation.endTime),
                reservation.name
            ].join(','))
        ].join('\n');
        
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `会議室予約一覧_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
    
    // 初期表示時に予約一覧を更新
    updateReservationList();
}); 