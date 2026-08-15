export interface KnowledgeCard {
  id: string;
  baslik: string;
  anahtarKelimeler: string[];
  icerik: string;
  kategori: string;
}

export const TEXTILE_KNOWLEDGE_LIBRARY: KnowledgeCard[] = [
  {
    id: 'hazir-giyim-nedir',
    baslik: 'Hazır Giyim ve Konfeksiyon Nedir?',
    kategori: 'temel-kavramlar',
    anahtarKelimeler: [
      'hazır giyim',
      'konfeksiyon',
      'nedir',
      'tanım',
      'üretim kademeleri',
      'model',
      'kalıp',
      'kesim',
      'dikim',
      'presleme',
      'ambalaj',
    ],
    icerik:
      'Hazır giyim (konfeksiyon), belirli beden ölçülerine göre seri hâlde üretilen giysilerin genel adıdır. Üretim, tek bir atölyede veya farklı işletmelerde gerçekleşen dört temel kademeden oluşur: 1) Model ve kalıp hazırlama — tasarımın kalıba dönüştürülmesi ve bedenlere göre seri kalıpların (grade) çıkarılması; 2) Kesim — kalıpların kumaş üzerine pastal planıyla yerleştirilip kesilmesi; 3) Dikim — kesilen parçaların birleştirilerek ürün hâline getirilmesi; 4) Presleme/ütü ve ambalaj — ürünün son kontrolünün yapılıp ütülenmesi, etiketlenmesi ve sevkiyata hazır hâle getirilmesi. Bu dört kademe birbirine bağlıdır; bir kademedeki hata veya gecikme sonraki kademeleri doğrudan etkiler.',
  },
  {
    id: 'model-kalip-hazirlama',
    baslik: 'Model ve Kalıp Hazırlama Süreci',
    kategori: 'temel-kavramlar',
    anahtarKelimeler: [
      'model',
      'kalıp',
      'model uygulama',
      'prototip',
      'numune',
      'kalıp serileştirme',
      'gradeleme',
      'grade',
      'şablon hazırlama',
      'şablon',
    ],
    icerik:
      'Model uygulama, tasarımcının çizdiği modelin kumaş ve dikiş özellikleri gözetilerek temel kalıba (baz kalıp) uygulanmasıdır. Bu aşamada önce numune bedeninde (genellikle orta beden, örn. 38/40) bir prototip/numune kalıp hazırlanır ve dikilerek prova edilir; gerekli düzeltmeler (fit, pens, kesim çizgileri) yapılır. Onaylanan numune kalıptan üretim kalıbı (master kalıp) çıkarılır. Kalıp serileştirme (grade/gradeleme), master kalıbın sipariş beden aralığına (ör. S-M-L-XL) göre büyütülüp küçültülmesidir; her beden arası ölçü farkı (grade kuralı) vücut ölçü tablosuna göre belirlenir. Son olarak şablon hazırlama aşamasında, kesimde kullanılacak sert kartondan veya plastikten üretim şablonları çıkarılır; şablonlar dikiş payı, yön okları, delik/çentik işaretleri gibi kesim bilgilerini içerir.',
  },
  {
    id: 'pastal-nedir',
    baslik: 'Pastal (Marker) Nedir?',
    kategori: 'pastal',
    anahtarKelimeler: [
      'pastal',
      'nedir',
      'pastal planı',
      'marker',
      'kumaş eni',
      'desen',
      'tüy yönü',
      'hav yönü',
      'düz iplik yönü',
      'çözgü yönü',
      'beden gruplama',
      'ekonomik yerleşim',
    ],
    icerik:
      'Pastal planı (marker), bir siparişin tüm beden ve parçalarının kumaş üzerine en az fire ile yerleştirilmesini gösteren kesim şablonudur; kesim öncesi kağıt veya dijital ortamda hazırlanır. Pastal hazırlanırken dikkat edilmesi gereken başlıca noktalar şunlardır: Kumaş eni — pastal, kullanılacak kumaşın net enine göre çizilir; Desen ve çizgi uyumu — ekose, çizgili veya desenli kumaşlarda parçalar arasında desen/çizgi devamlılığı sağlanmalıdır; Tüy yönü (hav yönü) — kadife, kotelli gibi yönlü kumaşlarda tüm parçalar aynı yönde yerleştirilmelidir, aksi hâlde renk/ton farkı oluşur; Düz iplik yönü (çözgü yönü) — kalıp üzerindeki yön okları kumaşın çözgü ipliği doğrultusuna paralel olacak şekilde hizalanmalıdır, aksi hâlde ürün çekmez/deforme olur; Beden gruplama — pastalda birden fazla beden bir arada kesilecekse bedenler kumaş tasarrufu sağlayacak şekilde gruplanır; Ekonomik yerleşim — parçalar arasındaki boşluklar en aza indirilerek kumaştan faydalanma oranı yükseltilir.',
  },
  {
    id: 'hammadde-deposu-yonetimi',
    baslik: 'Hammadde Deposu Yönetimi',
    kategori: 'depo-yonetimi',
    anahtarKelimeler: [
      'hammadde deposu',
      'depo yönetimi',
      'malzeme değerlendirme programı',
      'kumaş kontrolü',
      'sınıflandırma',
      'kalite kontrol',
      'yüzde yüz kontrol',
      'fifo',
      'lifo',
    ],
    icerik:
      'Kesimhaneye giren hammaddenin (kumaş, astar, aksesuar) doğru yönetimi, üretim kalitesi ve maliyeti açısından kritik önemdedir. Malzeme değerlendirme programı, gelen kumaş partilerinin hangi siparişte, hangi öncelikte kullanılacağını planlayan sistemdir; stok fazlası veya sipariş gecikmesi riskini azaltır. Kumaş kontrolü ve sınıflandırma aşamasında her top, çözgü/atkı hatası, renk farkı, leke, delik gibi kusurlar için kontrol edilir ve kusur yoğunluğuna göre 1., 2., 3. kalite gibi sınıflara ayrılır. Hazır giyim üretiminde hammaddenin %100 kontrolü esastır; çünkü kesim sırasında fark edilmeyen bir kumaş hatası, dikilmiş ürün hâline geldikten sonra çok daha yüksek maliyetle fire olarak geri döner. Depoda malzeme çıkışında iki temel yöntem kullanılır: FIFO (First In First Out — önce giren önce çıkar) ve LIFO (Last In First Out — son giren önce çıkar); yöntem seçimi siparişin renk/beden çeşitliliğine ve teslimat şekline göre değişir.',
  },
  {
    id: 'fifo-lifo-secimi',
    baslik: 'FIFO/LIFO Seçimi',
    kategori: 'depo-yonetimi',
    anahtarKelimeler: [
      'fifo',
      'lifo',
      'ne',
      'zaman',
      'kullanılır',
      'depo düzenleme',
      'asorti',
      'tek renk',
      'çok renk',
      'sevkiyat',
      'total shipment',
      'partial shipment',
      'parçalı teslimat',
    ],
    icerik:
      'Depo çıkış yöntemi seçimi, siparişin asorti (renk-beden) çeşitliliğine ve sevkiyat şekline göre belirlenir. Tek renk, tek veya çok bedenli siparişlerde FIFO (önce giren önce çıkar) yöntemi önerilir; bu yöntemde kumaş depoya giriş sırasına göre kullanılır, stok devri düzenli olur ancak farklı zamanlarda alınan kumaşlar arasında fiyat garantisi yoktur. Çok renkli ve çok bedenli siparişlerde ise LIFO (son giren önce çıkar) yöntemi tercih edilir; bu yöntem, aynı renk/parti kumaşın toplu ve tutarlı kullanılmasını sağlayarak renk/ton tutarlılığı ve fiyat garantisi sunar. Sevkiyat şekli de belirleyicidir: sipariş tek seferde (total shipment) teslim edilecekse FIFO ile düzenli stok devri yeterlidir; sipariş parçalı (partial shipment) teslim edilecekse, her sevkiyat grubunun kendi içinde tutarlı kumaştan kesilebilmesi için LIFO daha uygundur.',
  },
  {
    id: 'top-sonu-degerlendirme',
    baslik: 'Top Sonu Değerlendirme',
    kategori: 'pastal',
    anahtarKelimeler: [
      'top boyu',
      'pastal boyu',
      'pastal adedi',
      'top sonu',
      'kalan kumaş',
      'formül',
      'top sonu değerlendirme',
    ],
    icerik:
      'Kumaş topları standart pastal boyundan farklı uzunluklarda gelebilir; bu durumda top sonu (fire/artık) hesaplaması yapılır. Temel formül: Top Boyu : Pastal Boyu = Pastal Adedi şeklindedir; bölüm tam sayıya (aşağı) yuvarlanır çünkü kesirli bir pastal kesilemez. Örnek: 35 metrelik bir topdan 5,1 metrelik pastal ile kesim yapılacaksa, 35 / 5,1 = 6,86 olduğundan topdan 6 adet pastal çıkar; kullanılan kumaş 6 × 5,1 = 30,6 metre, kalan (top sonu) kumaş ise 35 − 30,6 = 4,4 metredir. Top sonlarında biriken kısa kumaşlar, mümkünse tek bedenli veya küçük ölçekli kesim emirlerinde değerlendirilerek fire oranı düşürülür.',
  },
  {
    id: 'kesimhane-tasarimi',
    baslik: 'Kesimhane Tasarımı',
    kategori: 'kesim',
    anahtarKelimeler: [
      'kesimhane',
      'tasarım',
      'hammadde gideri',
      'kesim işçiliği',
      'maliyet oranı',
      'yüzde elli',
      'yüzde altmış',
    ],
    icerik:
      "Kesimhanede iki temel tasarım türü uygulanır: Hammadde giderini azaltacak tasarım, pastal yerleşimini optimize ederek kumaş tüketimini düşürmeyi hedefler; parça sayısı, dikiş payı ve kıvırma payı gibi unsurlar gözden geçirilerek gereksiz kumaş kullanımı elenir. Kesim işçiliği tasarımı ise serim, kesim ve paketleme süreçlerinin süre ve iş gücü açısından verimli planlanmasını hedefler. Hazır giyim üretiminde toplam maliyetin yaklaşık %50-60'ını hammadde (kumaş ve aksesuar) gideri oluşturur; bu nedenle kesimhanedeki tasarım kararları, işçilik maliyetinden çok daha büyük bir kalemi doğrudan etkiler ve kâr marjı üzerinde belirleyici rol oynar.",
  },
  {
    id: 'kesim-emri-hazirlama',
    baslik: 'Kesim Emri Hazırlama',
    kategori: 'kesim',
    anahtarKelimeler: [
      'kesim emri',
      'tek bedenli',
      'çift bedenli',
      'çok bedenli',
      'dik bıçak',
      'kapasite',
      'kesim planlaması',
    ],
    icerik:
      'Kesim emri, bir siparişin hangi bedenlerde, hangi renkte, ne miktarda ve hangi pastal düzeninde kesileceğini gösteren üretim talimatıdır. Bedene göre tek bedenli, iki bedenli ve çok bedenli kesim emirleri olmak üzere üçe ayrılır. Kesim emri hazırlanırken kesimhanede kullanılan dik bıçağın kat kapasitesi (bir seferde kesebileceği maksimum kumaş katı sayısı) dikkate alınmalıdır; kapasitenin üzerinde kat serilmesi kesim hatası ve bıçak arızası riskini artırır. Kesim planlaması yapılırken sipariş miktarı, teslim tarihi, masa/pastal boyu ve mevcut kumaş stoğu birlikte değerlendirilerek en az fire ve en kısa sürede kesimi tamamlayacak plan oluşturulur.',
  },
  {
    id: 'tek-bedenli-kesim-emri',
    baslik: 'Tek Bedenli Kesim Emri',
    kategori: 'kesim',
    anahtarKelimeler: [
      'tek bedenli kesim emri',
      'tek beden',
      'artan kumaş',
      'top sonu değerlendirme',
      'örnek hesaplama',
    ],
    icerik:
      'Tek bedenli kesim emri, pastalda yalnızca bir bedenin tekrarlanarak yerleştirildiği en basit kesim düzenidir. Genellikle büyük miktarlı, tek beden yoğunluklu siparişlerde veya top sonlarında artan kısa kumaşları değerlendirmek amacıyla kullanılır; kısa top sonu bir bedenin dar pastalına uygun geldiğinde israf edilmeden kullanılabilir. Örnek hesaplama mantığı: sipariş miktarı tek bedende 500 adet ise ve bir pastalda aynı beden 40 kat hâlinde kesiliyorsa, 500 / 40 = 12,5 → 13 pastal seriminde (son serim 20 kat) sipariş tamamlanır; kat sayısı bıçak kapasitesini aşmayacak şekilde belirlenir.',
  },
  {
    id: 'iki-bedenli-kesim-emri',
    baslik: 'İki Bedenli Kesim Emri',
    kategori: 'kesim',
    anahtarKelimeler: [
      'iki bedenli kesim emri',
      'iki beden',
      'en büyük beden',
      'en küçük beden',
      'dengeleme kesimi',
      'kumaş tasarrufu',
    ],
    icerik:
      'İki bedenli kesim emirlerinde, aynı pastalda genellikle en büyük ve en küçük bedenin birlikte yerleştirilmesi tercih edilir; bu yönteme dengeleme kesimi (balanced marker) denir. Sebep, zıt bedenlerin kalıp şekillerinin (örneğin büyük bedenin geniş gövde parçası ile küçük bedenin dar kol parçası) pastalda birbirinin boşluklarını daha iyi doldurmasıdır; bu da orta bedenlerin birbirleriyle eşleştirilmesine göre daha az kumaş firesi ile sonuçlanır. Dengeleme kesiminde ayrıca iki bedenin toplam adetlerinin pastal başına kat sayısıyla uyumlu olmasına dikkat edilir ki üretim miktarı tam karşılansın.',
  },
  {
    id: 'cok-bedenli-kesim-emri',
    baslik: 'Çok Bedenli Kesim Emri',
    kategori: 'kesim',
    anahtarKelimeler: [
      'çok bedenli kesim emri',
      'masa boyu',
      'birim kumaş gideri',
      'beden sayısı',
      'kesilebilecek beden sayısı',
    ],
    icerik:
      'Üç ve üzeri beden içeren siparişlerde çok bedenli kesim emri hazırlanır. Bu düzende aynı pastalda kaç farklı bedenin bir arada kesileceği, masa (serim) boyu ile birim kumaş giderinin (bir bedenin kalıp uzunluğunun) oranlanmasıyla belirlenir: kesilebilecek beden sayısı = masa boyu / birim kumaş gideri (aşağı yuvarlanır). Örneğin masa boyu 20 metre, birim kumaş gideri 1,5 metre ise pastalda aynı anda en fazla 13 beden yerleştirilebilir. Çok bedenli pastallarda bedenler serpiştirilerek (küçükten büyüğe kademeli) yerleştirilir; bu, küçük parçaların büyük parçaların arasındaki boşluklardan alınmasına imkân tanıyarak kumaştan faydalanma oranını artırır.',
  },
  {
    id: 'kesim-iscilik-maliyeti-yontem1',
    baslik: 'Kesim İşçilik Maliyeti – Yöntem 1 (Oranlama)',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'kesim işçilik maliyeti',
      'işçilik maliyeti',
      'orantılama',
      'serim zamanı',
      'pastal hazırlama',
      'kaba kesim',
      'ince kesim',
      'masa temizleme',
      'yöntem 1',
    ],
    icerik:
      'Kesim işçilik maliyetinin birinci hesaplama yöntemi, işletmenin geçmiş verilerine dayanan süre oranlama yöntemidir. Bu yöntemde kesim sürecindeki her aşamanın süresi (dakika cinsinden) ayrı ayrı ölçülür ve toplanır: serim zamanı (kumaşın masaya serilme süresi), pastal hazırlama süresi, kaba kesim süresi (bant bıçakla ana parçaların kabaca ayrılması), ince kesim süresi (dik bıçakla parçaların net hatlarıyla kesilmesi) ve masa temizleme süresi. Bu beş sürenin toplamı, işletmenin standart iş günü süresine (genellikle 480 dakika = 8 saat) oranlanarak günlük işçilik ücretiyle çarpılır: Toplam Maliyet = (Toplam Süre / 480) × Günlük İşçilik Ücreti. Bu yöntem, geçmiş üretim verileri sağlıklı tutulan işletmelerde hızlı ve pratik bir maliyet tahmini sağlar.',
  },
  {
    id: 'kesim-iscilik-maliyeti-yontem2',
    baslik: 'Kesim İşçilik Maliyeti – Yöntem 2 (Formül)',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'kesim işçilik maliyeti',
      'formül',
      'masa boyu',
      'birim kumaş miktarı',
      'kesilebilecek beden sayısı',
      'serim',
      'pastal hazırlama',
      'kesim zamanı',
      'yöntem 2',
      'birim maliyet',
    ],
    icerik:
      'Kesim işçilik maliyetinin ikinci hesaplama yöntemi, teorik formüllerle detaylı hesaplama yöntemidir. Öncelikle kesilebilecek beden sayısı, masa boyunun birim kumaş miktarına (bir bedenin pastal üzerindeki uzunluğu) bölünmesiyle bulunur: Kesilebilecek Beden Sayısı = Masa Boyu / Birim Kumaş Gideri. Ardından süre bileşenleri hesaplanır: Serim Zamanı = Kat Sayısı × Serim Birim Süresi × Beden Sayısı; Pastal Hazırlama = Pastal Hazırlama Süresi × Beden Sayısı; Kesim Zamanı = Kesim Süresi × Beden Sayısı; Masa Temizleme = Masa Temizleme Süresi × Beden Sayısı. Bu dört sürenin toplamı, beklenmedik gecikmeleri karşılamak üzere belirlenen bir ek zaman yüzdesiyle çarpılarak toplam süreye ulaşılır. Toplam süre 480 dakikaya oranlanıp günlük işçilik ücretiyle çarpıldığında toplam maliyet, bu tutar kesilecek miktara bölündüğünde ise birim (adet başına) maliyet elde edilir. Bu yöntem, işletme geçmiş verisi olmayan yeni süreçlerde veya standart zaman etüdü yapılmış hatlarda daha isabetli sonuç verir.',
  },
  {
    id: 'hammadde-giderini-azaltma',
    baslik: 'Hammadde Giderini Azaltma',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'hammadde giderini azaltma',
      'kumaş tasarrufu',
      'tasarımcı',
      'planlamacı',
      'cep kapağı',
      'dikiş payı',
      'kıvırma payı',
      'parça ihtiyacı',
    ],
    icerik:
      'Kesimhanede hammadde (kumaş) giderini azaltmak, tasarımcı ile üretim planlamacısının yakın iş birliğini gerektirir. Bu iş birliğinde her parçanın gerçekten gerekli olup olmadığı sorgulanır: örneğin bir cep kapağının fonksiyonel mi yoksa dekoratif mi olduğu, dikiş payı miktarının kumaş kalınlığına göre gereğinden fazla bırakılıp bırakılmadığı, kıvırma (kenar katlama) payının azaltılıp azaltılamayacağı gibi detaylar tek tek incelenir. Ayrıca parça sayısının azaltılması (örneğin bir parçanın simetrik kesimle iki ayrı parça yerine tek parça hâlinde tasarlanması), kalıp köşelerinin yuvarlatılarak pastalda daha iyi iç içe geçmesinin sağlanması gibi tasarım müdahaleleri de kumaş tasarrufuna katkı sağlar. Bu küçük optimizasyonlar, yüksek adetli üretimlerde toplamda ciddi maliyet tasarrufuna dönüşür çünkü hammadde, toplam maliyetin en büyük kalemidir.',
  },
  {
    id: 'kumas-kayip-analizi',
    baslik: 'Kumaş Kayıp Analizi',
    kategori: 'pastal-verimliligi',
    anahtarKelimeler: [
      'kumaş kaybı',
      'kayıp',
      'kaybı',
      'kayıpları',
      'fire',
      'döküntü',
      'neden',
      'kumaş kayıp analizi',
      'abd araştırması',
      'vücut yüzeyi',
      'ilave şablon',
      'top sonu',
      'top başı',
      'mecburi kesim kaybı',
    ],
    icerik:
      "ABD'de yapılan bir hazır giyim sektörü araştırmasına göre, kesim sürecinde kumaş kaybı (fire) belirli kategorilere ayrılarak incelenmiştir. Bu araştırmaya göre kumaşın %45'i doğrudan vücut yüzeyini kaplayan asıl parçalarda kullanılır; %36'sı ilave şablon parçalarında (yaka, manşet, cep, astar gibi ek parçalarda) kullanılır; %2,6'sı kumaş eni kayıplarında (kumaşın kenarlarındaki kullanılamayan bant/kenar bölgesi) kaybolur; %1,8'i top sonu ve bindirme kayıplarında (pastal başı/sonu hizalama bindirmeleri) kaybolur; %2'si top başı kayıplarında (topun başlangıcındaki hatalı/kullanılamayan bölüm) kaybolur; kalan %8'i ise mecburi kesim kayıplarında (desen/çizgi uyumu, hav yönü gibi zorunlu sebeplerle oluşan ilave fire) kaybolur. Bu dağılım, kesimhanede iyileştirme yapılacak alanların önceliklendirilmesinde yol gösterici bir referanstır.",
  },
  {
    id: 'pastal-kontrol-hesabi',
    baslik: 'Pastal Kontrol Hesabı',
    kategori: 'pastal-verimliligi',
    anahtarKelimeler: [
      'pastal kontrolü',
      'şablon alanı',
      'tartma yöntemi',
      'kesim ve tartma yöntemi',
      'döküntü ağırlığı',
      'kağıt ağırlığı',
    ],
    icerik:
      'Hazırlanan bir pastalın gerçek şablon (parça) alanının hesaplanması iki yöntemle yapılabilir. Birinci yöntem tartma yöntemidir: pastal kağıdının tamamı ve üzerindeki şablonların kaplı olduğu kağıt parçası ayrı ayrı tartılır; kağıdın toplam alanı bilindiğinden, şablonların kapladığı kağıdın ağırlığının toplam kağıt ağırlığına oranı, şablon alanının toplam pastal alanına oranını verir (ağırlık orantısı = alan orantısı, çünkü kağıt homojen ve düzgün kalınlıktadır). İkinci yöntem kesim ve tartma yöntemidir: gerçek kumaş serimi kesildikten sonra ortaya çıkan döküntü (fire) kumaş tartılır; döküntünün ağırlığının toplam serilen kumaş ağırlığına oranı, kayıp oranını doğrudan verir, geri kalan oran ise gerçek şablon/kullanım alanını gösterir. İkinci yöntem gerçek üretim koşullarında ölçüldüğü için daha kesin sonuç verir, ancak kesim sonrasında uygulanabildiğinden önleyici değil doğrulayıcı bir kontrol niteliğindedir.',
  },
  {
    id: 'kumastan-faydalanma-yuzdesi',
    baslik: 'Kumaştan Faydalanma Yüzdesi',
    kategori: 'pastal-verimliligi',
    anahtarKelimeler: [
      'kumaştan faydalanma yüzdesi',
      'pastal verimi',
      'verimlilik',
      'formül',
      'şablon alanı',
      'kumaş eni',
      'kumaş boyu',
    ],
    icerik:
      'Kumaştan faydalanma yüzdesi (pastal verimi), bir pastalda kumaşın ne kadar etkin kullanıldığını gösteren temel performans göstergesidir. Formül şu şekildedir: Kumaştan Faydalanma Yüzdesi = (Toplam Şablon Alanı / (Kumaş Eni × Kumaş Boyu)) × 100. Burada toplam şablon alanı, pastaldaki tüm kalıp parçalarının kapladığı gerçek alan (m²) toplamıdır; kumaş eni × kumaş boyu ise pastalın kapladığı toplam dikdörtgen kumaş alanıdır. Sonuç yüzdesi ne kadar yüksekse, kumaş o kadar verimli kullanılmış demektir; sektörde genel kabul gören iyi bir pastal verimi %80-90 aralığındadır, bu değerin altına düşülmesi yüksek döküntü/fire oranına ve dolayısıyla artan maliyete işaret eder.',
  },
  {
    id: 'kumas-eni-secimi',
    baslik: 'Kumaş Eni Seçimi',
    kategori: 'pastal-verimliligi',
    anahtarKelimeler: [
      'kumaş eni',
      'en seçimi',
      'net en',
      'grafik eni',
      'geniş en',
      'dar en',
      'pastal verimi',
    ],
    icerik:
      'Kesimde kullanılacak kumaşın eni, pastal verimini doğrudan etkileyen önemli bir değişkendir. Genel kural olarak geniş enli kumaşlar, dar enli kumaşlara göre daha yüksek pastal verimi sağlama potansiyeline sahiptir; çünkü geniş bir pastalda küçük kalıp parçaları (kol, yaka, cep gibi), büyük parçaların bıraktığı boşluklardan ve aralardan daha kolay çıkarılabilir, bu da toplam döküntüyü azaltır. Kumaş eni değerlendirilirken iki farklı en tanımı ayırt edilmelidir: net en (grafik eni), kumaşın kenar (kenar payı/selvedge) çıkarıldıktan sonra fiilen kesim için kullanılabilir eni ifade eder; kumaşın satış/etiket eni ile net eni arasında fark olabilir ve pastal, her zaman net ene göre çizilmelidir. Yanlış en üzerinden hazırlanan bir pastal, gerçek kesimde kumaşın taşmasına veya eksik kalmasına yol açar.',
  },
  {
    id: 'beden-sayisi-pastal-verimi',
    baslik: 'Beden Sayısının Pastal Verimine Etkisi',
    kategori: 'pastal-verimliligi',
    anahtarKelimeler: [
      'beden sayısı',
      'pastal verimi',
      'beden karıştırma',
      'küçük beden',
      'büyük beden',
      'kumaş eni',
    ],
    icerik:
      'Bir pastalda aynı anda kesilen beden sayısı, kumaştan faydalanma oranını doğrudan etkiler. Tek beden tekrarlı pastallarda parçaların şekli birbirinin aynısı olduğundan boşluklar daha düzenli ama sınırlı şekilde doldurulabilir. Bedenler karıştırılarak (farklı bedenler bir arada) yerleştirildiğinde ise küçük bedenlerin parçaları, büyük bedenlerin parçaları arasında kalan düzensiz boşluklardan çıkarılabilir; bu da toplam verimi artırır. Özellikle küçük ve büyük bedenlerin kalıp parçalarının kumaşın eninde (yan yana) karşılıklı yerleştirilmesi — örneğin küçük bedenin dar parçası ile büyük bedenin geniş parçasının aynı hizada eşleştirilmesi — pastal genişliğinin (kumaş eninin) daha eksiksiz kullanılmasını sağlar. Bu nedenle çok bedenli siparişlerde pastal, tek tek bedenler yerine dengeli beden kombinasyonlarıyla hazırlanmalıdır.',
  },
  {
    id: 'organizasyon-tasarim',
    baslik: 'İşletme Organizasyonu ve Tasarım Türleri',
    kategori: 'organizasyon',
    anahtarKelimeler: [
      'organizasyon',
      'işletme organizasyonu',
      'moda tasarımı',
      'üretim tasarımı',
      'maliyet tasarımı',
      'fizibilite',
    ],
    icerik:
      'İşletme organizasyonu, bir hazır giyim işletmesinin ürünü fikir aşamasından sevkiyata kadar taşıyan iş akışının, yetki ve sorumlulukların planlı biçimde yapılandırılmasıdır. Bu süreçte üç temel tasarım türü birlikte yürütülür: Moda tasarımı, ürünün estetik, trend ve müşteri beğenisine yönelik görsel/stilistik yönünü belirler. Üretim tasarımı, moda tasarımının fabrika koşullarında (makine, iş gücü, süre) üretilebilir hâle getirilmesini, yani model-kalıp-kesim-dikim akışının planlanmasını kapsar. Maliyet tasarımı ise ürünün hammadde, işçilik ve genel giderlerinin hedef satış fiyatıyla uyumlu olacak şekilde planlanmasıdır. Bu üç tasarım türünün bir arada değerlendirilmesine fizibilite denir; fizibilite çalışması, bir modelin gerçekten üretilip üretilemeyeceğine, üretiliyorsa hangi koşullarda kârlı olacağına karar verilmesini sağlayan ön analizdir.',
  },
];

function tokenize(text: string): string[] {
  return text
    .toLocaleLowerCase('tr-TR')
    .split(/[^a-zçğıöşü0-9]+/)
    .filter((word) => word.length > 0);
}

export type KnowledgeCardMatch = {
  card: KnowledgeCard;
  score: number;
};

// Sorudaki her kelimeyi kartların anahtarKelimeler listesiyle karşılaştırır,
// her eşleşen kelime için +1 puan verir ve en yüksek skorlu kartı döndürür.
export function searchKnowledgeLibrary(
  question: string,
): KnowledgeCardMatch | null {
  const questionWords = new Set(tokenize(question));
  let best: KnowledgeCardMatch | null = null;

  for (const card of TEXTILE_KNOWLEDGE_LIBRARY) {
    const keywordWords = new Set(
      card.anahtarKelimeler.flatMap((keyword) => tokenize(keyword)),
    );

    let score = 0;
    for (const word of questionWords) {
      if (keywordWords.has(word)) {
        score += 1;
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { card, score };
    }
  }

  return best;
}
