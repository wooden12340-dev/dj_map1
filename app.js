// 지도 초기화 (부산광역시 중심)
const map = L.map('map').setView([35.1795543, 129.0756416], 11);

// 구글 지도 타일 레이어 추가 (한국 지역 상세 데이터 지원)
L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>'
}).addTo(map);

// 마커 클러스터 그룹 (대량의 마커를 성능 저하 없이 표시하기 위함)
let markers = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 50
});

// 전체 데이터 저장용 배열
let allStores = [];
// 고유 시군구(지역) 목록 저장용
let regions = new Set();

// 브랜드 분류 함수
function getBrandName(storeName) {
    const name = storeName.toUpperCase();
    if (name.includes('CU') || name.includes('씨유')) return 'CU';
    if (name.includes('GS25') || name.includes('지에스25')) return 'GS25';
    if (name.includes('세븐일레븐') || name.includes('7-ELEVEN') || name.includes('7ELEVEN')) return '세븐일레븐';
    if (name.includes('이마트24') || name.includes('EMART24')) return '이마트24';
    if (name.includes('미니스톱') || name.includes('MINISTOP')) return '미니스톱';
    return '기타';
}

// data.js에서 로드된 storeData 활용
function loadData() {
    if (typeof storeData === 'undefined') {
        alert("데이터를 불러오지 못했습니다. data.js 파일이 올바르게 생성되었는지 확인해주세요.");
        return;
    }

    storeData.forEach(row => {
        // 유효한 좌표가 있는 데이터만 처리
        if (row['위도'] && row['경도'] && !isNaN(row['위도']) && !isNaN(row['경도'])) {
            const store = {
                name: row['상호명'] || '이름 없음',
                branch: row['지점명'] || '',
                brand: getBrandName(row['상호명'] || ''),
                region: row['시군구명'] || '알 수 없음',
                address: row['도로명주소'] || row['지번주소'] || '주소 없음',
                lat: parseFloat(row['위도']),
                lng: parseFloat(row['경도'])
            };
            
            allStores.push(store);
            if(store.region !== '알 수 없음') {
                regions.add(store.region);
            }
        }
    });

    // 지역 필터 드롭다운 옵션 채우기
    populateRegionFilter();
    
    // 지도에 마커 렌더링
    updateMap();
}

// 지역 필터 드롭다운 초기화
function populateRegionFilter() {
    const regionSelect = document.getElementById('region-filter');
    const sortedRegions = Array.from(regions).sort();
    
    sortedRegions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    });
}

// 지도 및 마커 업데이트 함수
function updateMap() {
    // 기존 마커 모두 제거
    markers.clearLayers();
    
    const selectedRegion = document.getElementById('region-filter').value;
    const selectedBrand = document.getElementById('brand-filter').value;
    
    let count = 0;
    
    allStores.forEach(store => {
        // 필터 조건 확인
        const matchRegion = (selectedRegion === 'all') || (store.region === selectedRegion);
        const matchBrand = (selectedBrand === 'all') || (store.brand === selectedBrand);
        
        if (matchRegion && matchBrand) {
            count++;
            
            // 팝업 컨텐츠 구성
            const title = store.branch ? `${store.name} ${store.branch}` : store.name;
            const popupContent = `
                <div class="custom-popup">
                    <h3>${title}</h3>
                    <p><strong>브랜드:</strong> ${store.brand}</p>
                    <p><strong>지역:</strong> ${store.region}</p>
                    <p><strong>주소:</strong> ${store.address}</p>
                </div>
            `;
            
            // 마커 생성 및 팝업 바인딩
            const marker = L.marker([store.lat, store.lng])
                .bindPopup(popupContent);
                
            markers.addLayer(marker);
        }
    });
    
    // 맵에 클러스터 그룹 추가
    map.addLayer(markers);
    
    // 결과 수치 업데이트
    document.getElementById('result-count').textContent = count.toLocaleString();
}

// 이벤트 리스너 등록
document.getElementById('region-filter').addEventListener('change', updateMap);
document.getElementById('brand-filter').addEventListener('change', updateMap);

// 데이터 로드 실행
loadData();
