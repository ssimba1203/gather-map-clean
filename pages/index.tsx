
import { useEffect, useState } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

type FriendLocation = {
  id: number;
  lat: number;
  lng: number;
  marker: any;
  address: string;
};

export default function Home() {
  const [friendAddress, setFriendAddress] = useState("");
  const [map, setMap] = useState<any>(null);
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  const [nextFriendId, setNextFriendId] = useState(1);
  const [midMarker, setMidMarker] = useState<any>(null);
  const [placeMarkers, setPlaceMarkers] = useState<any[]>([]);
  const [places, setPlaces] = useState<{ place_name: string; address_name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("맛집");

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&autoload=false&libraries=services`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        let lat = 37.5665;
        let lng = 126.9780;

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              lat = position.coords.latitude;
              lng = position.coords.longitude;
              loadMap(lat, lng);
            },
            () => loadMap(lat, lng)
          );
        } else {
          loadMap(lat, lng);
        }

        function loadMap(lat: number, lng: number) {
          const container = document.getElementById("map");
          const options = {
            center: new window.kakao.maps.LatLng(lat, lng),
            level: 3,
          };
          const createdMap = new window.kakao.maps.Map(container, options);

          new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(lat, lng),
            map: createdMap,
            title: "내 위치",
          });

          setMap(createdMap);
        }
      });
    };
  }, []);

  function searchFriendAddress() {
    if (!map) return;

    const places = new window.kakao.maps.services.Places();

    places.keywordSearch(friendAddress, function (result: any, status: any) {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        const lat = parseFloat(result[0].y);
        const lng = parseFloat(result[0].x);
        const coord = new window.kakao.maps.LatLng(lat, lng);

        map.setCenter(coord);

        const overlayContent = `<div style="background:#4285f4;color:white;border-radius:50%;padding:4px 8px;font-size:14px;">
          ${nextFriendId}
        </div>`;

        const overlay = new window.kakao.maps.CustomOverlay({
          position: coord,
          content: overlayContent,
          yAnchor: 1,
        });

        overlay.setMap(map);

        const newFriend = {
          id: nextFriendId,
          lat,
          lng,
          marker: overlay,
          address: friendAddress
        };
        setNextFriendId(nextFriendId + 1);

        const updated = [...friendLocations, newFriend];
        setFriendLocations(updated);
        updateMidpoint(updated, selectedCategory);
      } else {
        alert("주소를 찾을 수 없습니다.");
      }
    });
  }

  function removeFriend(id: number) {
    const removed = friendLocations.find((f) => f.id === id);
    if (removed?.marker) removed.marker.setMap(null);

    const updated = friendLocations.filter((f) => f.id !== id);
    setFriendLocations(updated);
    updateMidpoint(updated, selectedCategory);
  }

  function updateMidpoint(locations: FriendLocation[], category: string) {
    if (!map) return;

    if (locations.length < 2) {
      if (midMarker) {
        midMarker.setMap(null);
        setMidMarker(null);
      }
      setPlaces([]);
      placeMarkers.forEach((m) => m.setMap(null));
      return;
    }

    const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
    const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;
    const midPoint = new window.kakao.maps.LatLng(avgLat, avgLng);

    if (midMarker) midMarker.setMap(null);

    const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png";
    const imageSize = new window.kakao.maps.Size(24, 35);
    const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);

    const newMarker = new window.kakao.maps.Marker({
      position: midPoint,
      map: map,
      title: "중간 지점",
      image: markerImage,
    });

    setMidMarker(newMarker);
    map.setCenter(midPoint);

    const placesService = new window.kakao.maps.services.Places();
    placesService.keywordSearch(
      category,
      function (data: any, status: any) {
        if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
          const newMarkers: any[] = [];
          const top5 = data.slice(0, 5);

          top5.forEach((place: any) => {
            const position = new window.kakao.maps.LatLng(place.y, place.x);
            const marker = new window.kakao.maps.Marker({
              map,
              position,
              title: place.place_name,
            });
            newMarkers.push(marker);
          });

          placeMarkers.forEach((m) => m.setMap(null));
          setPlaceMarkers(newMarkers);
          setPlaces(top5);
        }
      },
      { location: midPoint, radius: 1000 }
    );
  }

  function resetFriends() {
    friendLocations.forEach((f) => f.marker.setMap(null));
    placeMarkers.forEach((m) => m.setMap(null));
    if (midMarker) midMarker.setMap(null);

    setFriendLocations([]);
    setPlaceMarkers([]);
    setMidMarker(null);
    setPlaces([]);
    setNextFriendId(1);
  }

  return (
    <div>
      <h1>모임 지도앱</h1>
      <p style={{ marginTop: '-10px', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
      친구들이랑 어디서 모여야 할 지 정하기 성가시죠?<br />
      이게 대신 해드립니다. 친구들 주소(전철역, 대략적인 지역) 적으시면,<br />
      추천 지역을 알려드려요.<br />
      <strong>피드백은 아주 감사히 받겠습니다 🙏<br />– 천성득 올림 –</strong>
      </p>
      <label>카테고리:
        <select
          value={selectedCategory}
          onChange={(e) => {
            const newCategory = e.target.value;
            setSelectedCategory(newCategory);
            if (friendLocations.length >= 2) updateMidpoint(friendLocations, newCategory);
          }}
        >
          <option value="맛집">맛집</option>
          <option value="카페">카페</option>
          <option value="편의점">편의점</option>
        </select>
      </label>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          searchFriendAddress();
        }}
      >
        <input
          type="text"
          placeholder="친구 주소 입력"
          value={friendAddress}
          onChange={(e) => setFriendAddress(e.target.value)}
        />
        <button type="submit">추가</button>
      </form>

      <button onClick={resetFriends}>전체 초기화</button>

      <div id="map" style={{ width: "100%", height: "500px", margin: "20px 0" }} />

      <h3>친구 목록</h3>
      <ul>
        {friendLocations.map((f) => (
          <li key={f.id}>
            친구 {f.id}: {f.address}
            <button onClick={() => removeFriend(f.id)}>❌ 삭제</button>
          </li>
        ))}
      </ul>

      <h3>중간 지점 근처 {selectedCategory} 추천</h3>
      <ul>
        {places.map((place, index) => (
          <li key={index}>
            <strong>{place.place_name}</strong> - <a href={`https://map.naver.com/v5/search/${encodeURIComponent(place.place_name)}`} target="_blank" rel="noopener noreferrer" style={{ color: "#3498db", textDecoration: "underline" }}>{place.address_name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
