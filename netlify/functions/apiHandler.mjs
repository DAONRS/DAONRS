export const handler = async (event) => {
  const KAKAO_REST_KEY = process.env.KAKAO_REST_KEY;
  const WEATHER_KEY = process.env.WEATHER_KEY;
  const { type, ...params } = event.queryStringParameters;

  try {
    // 1. 카카오 주소 -> 좌표 변환 (REST API 전용)
    if (type === 'address') {
      if (!KAKAO_REST_KEY) throw new Error("KAKAO_REST_KEY가 설정되지 않았습니다.");

      const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(params.address)}`;
      
      const res = await fetch(url, { 
        headers: { 
          "Authorization": `KakaoAK ${KAKAO_REST_KEY}` 
        } 
      });
      
      const data = await res.json();
      
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };
    }

    // 2. 기상청 초단기 실황 조회
    if (type === 'weather') {
      const { base_date, base_time, nx, ny } = params;
      const serviceKey = encodeURIComponent(decodeURIComponent(WEATHER_KEY));
      const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${serviceKey}&pageNo=1&numOfRows=10&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;

      const res = await fetch(url);
      const data = await res.json();
      
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };
    }
  } catch (error) {
    console.error("Server Error:", error.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};