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
    id: 'kumas-nedir-tanimi',
    baslik: 'Kumaş Nedir?',
    kategori: 'temel-kavramlar',
    anahtarKelimeler: [
      'kumaş',
      'nedir',
      'tekstil lifi',
      'dokuma',
      'örme',
      'dokusuz yüzey',
      'gramaj',
      'hammadde tipi',
    ],
    icerik:
      'Kumaş, tekstil liflerinin (pamuk, yün, polyester, ipek vb.) belirli bir yüzey oluşturacak şekilde bir araya getirilmesiyle elde edilen malzemedir. Kumaş üretiminde üç temel yöntem kullanılır: Dokuma, çözgü (boyuna) ve atkı (enine) ipliklerinin dik açıyla birbirinin altından ve üstünden geçirilmesiyle oluşturulur. Örme, ipliklerin iğneler yardımıyla ilmek hâline getirilip birbirine bağlanmasıyla oluşturulur. Dokusuz yüzey (nonwoven), liflerin iplik veya ilmek aşamasından geçmeden, mekanik, kimyasal veya ısıl işlemlerle doğrudan birbirine bağlanmasıyla elde edilir; ne dokuma ne de örmedir, genellikle tek kullanımlık ürünlerde (maske, hijyenik ürünler) veya astar/dolgu malzemelerinde kullanılır. Bir kumaşın temel özellikleri şunlardır: Gramaj, kumaşın 1 metrekaresinin gram cinsinden ağırlığıdır (g/m²) ve kumaşın kalınlığı/ağırlığı hakkında fikir verir. En, kumaşın kullanılabilir genişliğidir ve pastal/kesim planlamasını doğrudan etkiler. Hammadde tipi, kumaşın hangi elyaftan (pamuk, polyester, yün vb.) veya elyaf karışımından üretildiğini belirtir ve kumaşın performansını, bakımını ve maliyetini etkiler. Dokuma/örme yapısı ise kumaşın esneklik, dayanıklılık ve kullanım alanını belirleyen temel yapısal özelliğidir.',
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
  {
    id: 'dikim-hatti-organizasyonu',
    baslik: 'Dikim Hattı Organizasyonu (Bant Sistemi)',
    kategori: 'dikim',
    anahtarKelimeler: [
      'dikim hattı',
      'bant sistemi',
      'operasyon bölme',
      'operatör',
      'hat dengeleme',
      'darboğaz',
      'darboğaz operasyon',
    ],
    icerik:
      'Dikim hattı (bant sistemi), bir ürünün dikilmesi için gereken tüm işlemlerin (operasyonların) küçük parçalara bölünüp her operatöre yalnızca bir veya birkaç işlemin atandığı üretim düzenidir. Operasyon bölme mantığında ürün, omuz dikişi, kol takma, yan dikiş gibi bağımsız işlemlere ayrılır; her operatör kendi istasyonunda sürekli aynı işlemi tekrarlayarak uzmanlaşır ve hız kazanır. Yarı mamul (kesilmiş/kısmen dikilmiş parça), bant veya taşıma sistemiyle bir operatörden diğerine aktarılır. Hat dengeleme (line balancing), her operasyonun süresinin birbirine yakın olacak şekilde iş yükünün dağıtılmasıdır; amaç hiçbir istasyonun diğerlerinden çok daha yavaş kalmamasıdır. Darboğaz (bottleneck) operasyon, hattaki en uzun süren işlemdir; hattın toplam üretim hızı bu en yavaş operasyonun hızıyla sınırlıdır, çünkü önündeki istasyonlar üretime devam etse bile ürün darboğazın önünde birikir.',
  },
  {
    id: 'dikim-operasyon-analizi',
    baslik: 'Dikim Operasyon Analizi',
    kategori: 'dikim',
    anahtarKelimeler: [
      'operasyon analizi',
      'operasyon bölme',
      'sam',
      'smv',
      'standart dakika',
      'standart zaman',
      'tişört operasyonları',
      'omuz dikişi',
      'kol takma',
      'yan dikiş',
    ],
    icerik:
      "Bir ürünün dikim sürecine başlamadan önce, o ürünün üretiminde gereken tüm işlemler tek tek listelenir; buna operasyon analizi (operation breakdown) denir. Örneğin basit bir tişört için tipik operasyon listesi şöyle olabilir: omuz dikişi (overlok), kol takma, yan dikiş (kol altından etek ucuna), etek büzgü/reçme, yaka bantlama, kol ağzı büzgü, etiket takma ve ip temizleme. Her operasyon için standart dakika (SAM — Standard Allowed Minute, ya da SMV — Standard Minute Value) belirlenir; bu, ortalama yetenekteki bir operatörün o işlemi normal tempoda tamamlaması için gereken süredir ve zaman etüdü (kronometreli ölçüm) ile hesaplanır. Tüm operasyonların SAM değerlerinin toplamı, o ürünün toplam dikim SAM'ini verir; bu değer hem hat dengeleme hem de maliyetlendirme hesaplarının temelini oluşturur.",
  },
  {
    id: 'hat-verimliligi-hesaplama',
    baslik: 'Hat Verimliliği Hesaplama',
    kategori: 'dikim',
    anahtarKelimeler: [
      'hat verimliliği',
      'verimlilik',
      'formül',
      'hedef üretim',
      'gerçekleşen üretim',
      'çalışma dakikası',
      'sam',
      'operatör sayısı',
    ],
    icerik:
      'Hat verimliliği, bir dikim hattının plana göre ne kadar etkin çalıştığını gösteren temel performans göstergesidir. Formül: Hat Verimliliği (%) = (Gerçekleşen Üretim / Hedef Üretim) × 100. Buradaki hedef üretim, hattın teorik olarak o vardiyada üretmesi gereken adet sayısıdır ve şu formülle hesaplanır: Hedef Üretim = (Çalışma Dakikası / SAM) × Operatör Sayısı. Örneğin bir hatta 20 operatör 480 dakika (8 saat) çalışıyorsa ve ürünün toplam SAM değeri 12 dakika ise, hedef üretim = (480 / 12) × 20 = 800 adettir. Vardiya sonunda hat gerçekte 680 adet üretmişse, hat verimliliği = (680 / 800) × 100 = %85 olur. Verimlilik oranı düştükçe duruşlar, dengesiz operasyonlar, malzeme bekleme veya kalite sorunları gibi kök nedenler araştırılmalıdır.',
  },
  {
    id: 'kalite-kontrol-noktalari',
    baslik: 'Dikim Sürecinde Kalite Kontrol Noktaları',
    kategori: 'kalite',
    anahtarKelimeler: [
      'kalite kontrol',
      'ara kontrol',
      'son kontrol',
      'in-line inspection',
      'final inspection',
      'hata tespiti',
      'kalite kontrol noktaları',
    ],
    icerik:
      'Dikim sürecinde ürün kalitesini güvence altına almak için iki temel kontrol noktası uygulanır. Ara kontrol (in-line inspection), hat üzerinde üretim devam ederken belirli istasyonlarda veya belirli aralıklarla yapılan kontroldür; amaç bir hata daha az sayıda parçaya yayılmadan erken tespit edilmesidir. Son kontrol (final inspection), ürün tamamen dikilip ütülendikten sonra, paketlemeden önce yapılan kapsamlı kontroldür; dikiş kalitesi, ölçü doğruluğu, temizlik (ip artığı, leke) ve genel görünüm değerlendirilir. Herhangi bir kontrol noktasında hata tespit edildiğinde, hatalı parça üretim hattından ayrılıp işaretlenir; hata onarılabilir nitelikteyse tamir istasyonuna (repair) yönlendirilir, onarılamıyorsa 2. kalite veya fire olarak sınıflandırılır. Ayrıca hatanın kaynağı (hangi operasyon/operatör) belirlenerek aynı hatanın tekrarlanması önlenmeye çalışılır.',
  },
  {
    id: 'ikinci-kalite-nedir',
    baslik: '2. Kalite Ürün Nedir?',
    kategori: 'kalite',
    anahtarKelimeler: [
      '2. kalite',
      'ikinci kalite',
      'kalite',
      'nedir',
      'kusurlu ürün',
      'dikiş hatası',
      'ölçü sapması',
      'kabul edilebilir oran',
      'yüzde 2',
      'yüzde 5',
    ],
    icerik:
      '2. kalite (second quality), üretim standartlarını tam karşılamayan ancak yine de satılabilir durumda olan ürünleri tanımlayan sınıflandırmadır. Küçük dikiş hatası, hafif leke, ufak ölçü sapması, asimetrik detaylar gibi kusurlar taşıyan ürünler bu kategoriye girer; kusur, ürünün kullanımını veya temel işlevini engellemeyecek kadar küçüktür ancak 1. kalite (birinci kalite) standardına uymadığı için genellikle indirimli fiyatla veya farklı bir kanaldan (outlet, iç pazar) satılır. 2. kalite oranı, bir işletmenin üretim kalitesinin önemli bir göstergesidir; bu oran ne kadar düşükse üretim süreçleri o kadar kontrollü ve tutarlı demektir. Hazır giyim sektöründe genel kabul gören kabul edilebilir 2. kalite oranı, ürün ve işletmeye göre değişmekle birlikte genellikle %2-5 aralığındadır; bu oranın üzerine çıkılması süreçlerde ciddi bir kalite sorununa işaret eder ve kök neden analizi gerektirir.',
  },
  {
    id: 'fire-orani-hesaplama',
    baslik: 'Fire Oranı Hesaplama',
    kategori: 'kalite',
    anahtarKelimeler: [
      'fire oranı',
      'fire',
      'formül',
      'bozuk ürün',
      'kullanılamaz ürün',
      'kabul edilebilir fire',
      'basit ürün',
      'karmaşık ürün',
    ],
    icerik:
      "Fire oranı, üretim sürecinde tamamen kullanılamaz hâle gelen (satılamayan, onarılamayan) ürünlerin toplam üretime oranını gösteren bir kalite ve verimlilik göstergesidir. Formül: Fire Oranı (%) = (Bozuk/Kullanılamaz Ürün Sayısı / Toplam Üretim) × 100. Örneğin 1000 adetlik bir üretimde 15 adet ürün onarılamaz şekilde hatalıysa, fire oranı = (15 / 1000) × 100 = %1,5'tir. Kabul edilebilir fire oranı ürünün karmaşıklığına göre değişir: basit, az parçalı ürünlerde (tişört, basit etek gibi) kabul edilebilir fire oranı genellikle %1-2 aralığındadır; çok parçalı, çok dikiş operasyonlu veya hassas malzemeli karmaşık ürünlerde (ceket, elbise gibi) bu oran %3-5 aralığına kadar çıkabilir çünkü hata olasılığı her ek operasyonla birlikte artar. Fire oranının düzenli takibi, hangi operasyon veya malzemenin en çok soruna yol açtığının belirlenmesine yardımcı olur.",
  },
  {
    id: 'utu-pres-islemi',
    baslik: 'Ütü/Pres İşlemi',
    kategori: 'kalite',
    anahtarKelimeler: [
      'ütü',
      'pres',
      'buharlı pres',
      'düz ütü',
      'sıcaklık ayarı',
      'pamuk',
      'sentetik',
      'son form',
    ],
    icerik:
      'Ütü/pres işlemi, dikilmiş ürüne son formunu vermek, dikiş yerlerini düzleştirmek ve kumaş üzerindeki kırışıklıkları gidermek amacıyla dikim sonrası uygulanan işlemdir; müşteri gözünde ürünün ilk izlenimini doğrudan etkiler. Buharlı pres, kalıplı bir pres makinesiyle ürüne buhar ve basınç uygulayarak kısa sürede ve tutarlı şekilde form verir; özellikle yaka, kol ağzı gibi karmaşık bölgelerde ve yüksek adetli üretimde tercih edilir. Düz ütü ise elle veya masa ütüsüyle yapılan, daha esnek ama daha yavaş ve operatör becerisine bağlı bir yöntemdir; küçük seri veya özel detay gerektiren ürünlerde kullanılır. Kumaş tipine göre sıcaklık ayarı kritik önemdedir: pamuk gibi doğal lifler yüksek sıcaklığa (yaklaşık 180-200°C) dayanıklıdır ve yüksek sıcaklıkta daha iyi form alır; polyester, naylon gibi sentetik lifler ise düşük sıcaklıkta (yaklaşık 110-150°C) ütülenmelidir, aksi hâlde erime, parlama veya kumaşın deforme olması (büzülme, sertleşme) riski oluşur.',
  },
  {
    id: 'paketleme-standartlari',
    baslik: 'Paketleme Standartları',
    kategori: 'paketleme',
    anahtarKelimeler: [
      'paketleme',
      'katlama standardı',
      'poşetleme',
      'karton',
      'koli düzeni',
      'barkod',
      'etiket kontrolü',
      'adet sayımı',
    ],
    icerik:
      'Paketleme, ürünün son kontrolden geçip müşteriye sevk edilmeden önceki son üretim aşamasıdır ve müşteri talimatına (packing instruction) tam uyum gerektirir. Katlama standardı, ürünün müşterinin belirlediği ölçü ve şekilde (ör. belirli bir genişlik ve uzunlukta, kart üzerine sarılarak) katlanmasıdır; standart dışı katlama, kolilerde yer israfına ve görsel tutarsızlığa yol açar. Poşetleme aşamasında ürün, nem ve kirden koruyacak polybag içine yerleştirilir; bazı müşteriler boğulma riskine karşı poşet üzerine uyarı deliği (suffocation warning hole) istenmesini şart koşar. Karton/koli düzeni, her kolinin içine hangi beden ve renk kombinasyonunun kaç adet konulacağını belirleyen asorti planına göre yapılır; koli üzerine içerik, ağırlık ve sipariş bilgileri yazılır. Barkod/etiket kontrolü aşamasında her üründeki fiyat etiketi, bakım etiketi ve barkodun doğru, okunur ve müşterinin istediği bilgilerle uyumlu olduğu teyit edilir. Son olarak adet sayımı yapılarak paketlenen toplam miktarın sipariş miktarıyla birebir eşleştiği doğrulanır.',
  },
  {
    id: 'sevkiyat-hazirlik',
    baslik: 'Sevkiyat Hazırlığı',
    kategori: 'paketleme',
    anahtarKelimeler: [
      'sevkiyat',
      'sevkiyat hazırlık',
      'miktar kontrolü',
      'evrak kontrolü',
      'fatura',
      'packing list',
      'çeki listesi',
      'konteyner',
      'kargo planlaması',
      'exf tarihi',
      'sevkiyat takvimi',
    ],
    icerik:
      'Sevkiyat öncesi hazırlık, siparişin doğru miktarda ve zamanında müşteriye ulaşmasını garanti altına alan son kontrol sürecidir. Miktar kontrolü, paketlenmiş koli sayısının ve toplam adedin sipariş miktarıyla ve varsa toleransla (genellikle +/- %3-5) uyumlu olduğunun teyit edilmesidir. Evrak kontrolü aşamasında fatura (invoice), packing list (koli içeriği listesi) ve çeki listesi gibi belgelerin eksiksiz, doğru ve birbirleriyle tutarlı olduğu doğrulanır; bu evraklardaki bir hata gümrükte ciddi gecikmelere yol açabilir. Konteyner/kargo planlaması, sevk edilecek toplam hacim ve ağırlığa göre uygun taşıma aracının (konteyner tipi, kamyon, hava kargo) seçilmesi ve yükleme planının (loading plan) hazırlanmasıdır. Tüm bu adımlar, siparişin EXF (ex-factory, fabrikadan çıkış) tarihine göre oluşturulan sevkiyat takvimine uygun şekilde zamanlanır; EXF tarihinin kaçırılması, müşterinin nihai teslim tarihini de geciktirerek sözleşme cezalarına yol açabilir.',
  },
  {
    id: 'hat-dengeleme',
    baslik: 'Hat Dengeleme (Line Balancing)',
    kategori: 'dikim',
    anahtarKelimeler: [
      'hat dengeleme',
      'line balancing',
      'iş yükü',
      'darboğaz',
      'darboğaz operasyon',
      'yarı mamul',
      'wip',
      'bekleyen stok',
    ],
    icerik:
      'Hat dengeleme (line balancing), bir dikim hattındaki operasyonlar arasındaki iş yükünün mümkün olduğunca eşit dağıtılması sürecidir; amaç her operatörün/istasyonun birbirine yakın sürelerde çalışmasını sağlayarak hattın bir bütün olarak en yüksek verimle akmasını sağlamaktır. Operasyonlar arasındaki süre farkları büyükse, en uzun süren operasyon (darboğaz operasyon) tüm hattın hızını belirler; darboğazdan önceki istasyonlar daha hızlı çalışsa bile ürettikleri parçalar darboğazın önünde birikir, darboğazdan sonraki istasyonlar ise parça bekleyerek boş durur. Dengesiz bir hatta, operasyonlar arasında biriken yarı mamul (WIP — Work In Process) miktarı artar; bu hem alan israfına hem de ürünün hat içinde daha uzun süre kalmasına (üretim süresinin uzamasına) yol açar. Hat dengeleme, darboğaz operasyonu birden fazla operatöre bölerek, hızlı operasyonları birleştirerek veya operatörleri operasyonlar arasında yeniden dağıtarak yapılır; iyi dengelenmiş bir hatta WIP birikimi minimuma iner ve hat verimliliği artar.',
  },
  {
    id: 'operator-verimliligi',
    baslik: 'Operatör Verimliliği',
    kategori: 'dikim',
    anahtarKelimeler: [
      'operatör verimliliği',
      'operatör',
      'verimlilik',
      'öğrenme eğrisi',
      'yeni operatör',
      'sam',
      'üretilen adet',
      'çalışılan dakika',
    ],
    icerik:
      "Operatör verimliliği, bireysel bir operatörün belirli bir sürede ne kadar etkin çalıştığını ölçen performans göstergesidir. Formül: Operatör Verimliliği (%) = (Üretilen Adet × SAM) / Çalışılan Dakika × 100. Örneğin bir operatör 480 dakikalık bir vardiyada, SAM değeri 0,8 dakika olan bir operasyondan 550 adet üretmişse, verimlilik = (550 × 0,8) / 480 × 100 = yaklaşık %91,7'dir. Yeni işe başlayan veya yeni bir operasyona geçen operatörlerde öğrenme eğrisi (learning curve) kavramı devreye girer: ilk günlerde/haftalarda verimliliğin standart seviyenin belirgin şekilde altında (örneğin %40-60 aralığında) olması normal kabul edilir, operatör işlemi tekrarladıkça hız ve doğruluk kazanarak zamanla standart verimliliğe ulaşır. Bu nedenle yeni operatörlerin performansı, deneyimli operatörlerle aynı hedeflerle değil, öğrenme eğrisine göre kademeli artan hedeflerle değerlendirilmelidir.",
  },
  {
    id: 'kumas-hazirlik-dikim-oncesi',
    baslik: 'Dikim Öncesi Kumaş Hazırlığı',
    kategori: 'dikim',
    anahtarKelimeler: [
      'kumaş hazırlığı',
      'dikim öncesi',
      'bantlama',
      'numaralama',
      'kesim partisi',
      'lot',
      'ton farkı',
    ],
    icerik:
      'Kesim tamamlandıktan sonra parçaların dikim hattına gönderilmeden önce belirli bir hazırlık sürecinden geçmesi gerekir. Bantlama/numaralama, aynı pastalda kesilen ve birbirine ait olan tüm parçalara (ön beden, arka beden, kol, yaka vb.) aynı numaranın verilmesi işlemidir; bu, dikim sırasında farklı kesim katlarından gelen parçaların karışmasını önler ve her ürünün kendi eşleşen parçalarıyla dikilmesini garanti eder. Aynı kesim partisinin (lot) karışmaması büyük önem taşır çünkü farklı zamanlarda veya farklı kumaş toplarından kesilen partiler arasında, aynı renk kodunda olsa bile üretim/boyama farkından kaynaklanan ton farkı (renk tonu sapması) riski vardır. Özellikle bir ürünün farklı parçaları (örneğin bir ceketin ön ve arka bedeni) farklı lotlardan gelirse, ürün tamamlandığında gözle görülür renk uyumsuzluğu ortaya çıkabilir; bu nedenle kumaş hazırlığı aşamasında lot takibi titizlikle yapılmalı ve karışan partiler dikim öncesinde ayıklanmalıdır.',
  },
  {
    id: 'birim-maliyet-nedir',
    baslik: 'Birim Maliyet Nedir?',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'birim maliyet',
      'maliyet',
      'nedir',
      'hammadde',
      'işçilik',
      'genel gider',
      'kar marjı',
      'kâr marjı',
    ],
    icerik:
      'Birim maliyet, bir üründen tek bir adet üretmenin işletmeye toplam kaça mal olduğunu gösteren temel maliyet göstergesidir; fiyatlandırma, teklif hazırlama ve kârlılık analizinin temelini oluşturur. Birim maliyet dört ana bileşenden oluşur: 1) Hammadde maliyeti — o ürün için kullanılan kumaş, astar ve aksesuarların toplam bedeli; 2) İşçilik maliyeti — ürünün kesim, dikim, ütü ve paketleme aşamalarında harcanan emeğin karşılığı; 3) Genel gider payı — kira, elektrik, yönetim, amortisman gibi doğrudan üretime bağlı olmayan ama işletmenin faaliyetini sürdürmesi için gerekli giderlerden ürüne düşen pay; 4) Kâr marjı — işletmenin bu üründen elde etmeyi hedeflediği kâr oranı. İlk üç bileşen (hammadde + işçilik + genel gider) toplam maliyeti oluşturur; kâr marjı bu toplam maliyetin üzerine eklenerek satış fiyatına ulaşılır.',
  },
  {
    id: 'hammadde-maliyeti-hesaplama',
    baslik: 'Hammadde Maliyeti Hesaplama',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'hammadde maliyeti',
      'kumaş maliyeti',
      'aksesuar maliyeti',
      'sarfiyat',
      'birim fiyat',
      'formül',
    ],
    icerik:
      "Hammadde maliyeti, bir üründe kullanılan tüm kumaş ve aksesuarların toplam bedelidir ve genellikle birim maliyetin en büyük kalemini oluşturur (toplam maliyetin yaklaşık %50-60'ı). Kumaş maliyeti şu formülle hesaplanır: Kumaş Maliyeti = Sarfiyat (m/adet) × Birim Kumaş Fiyatı. Örneğin bir tişört için sarfiyat 1,35 m/adet ve kumaşın metre fiyatı 4 USD ise, kumaş maliyeti = 1,35 × 4 = 5,4 USD/adet olur. Aksesuar maliyeti ise ürün üzerindeki her bir aksesuar kalemi (fermuar, düğme, etiket, iplik vb.) için ayrı ayrı hesaplanır: Aksesuar Maliyeti = Birim Fiyat × Kullanılan Miktar; tüm aksesuar kalemlerinin toplamı ürünün toplam aksesuar maliyetini verir. Kumaş maliyeti ile toplam aksesuar maliyetinin toplamı, ürünün hammadde maliyetini oluşturur: Hammadde Maliyeti = Kumaş Maliyeti + Toplam Aksesuar Maliyeti.",
  },
  {
    id: 'iscilik-maliyeti-nedir',
    baslik: 'İşçilik Maliyeti Nedir?',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'işçilik maliyeti',
      'nedir',
      'sam',
      'standart dakika',
      'dakika başı ücret',
      'formül',
    ],
    icerik:
      "İşçilik maliyeti, bir ürünün kesim, dikim, ütü ve paketleme aşamalarında harcanan emeğin parasal karşılığıdır. Hesaplama, ürünün toplam SAM (Standard Allowed Minute — standart dakika) değerine dayanır; SAM, ortalama yetenekteki bir operatörün ürünü normal tempoda üretmesi için gereken toplam süredir ve operasyon analizinde her bir işlemin (omuz dikişi, kol takma, yan dikiş vb.) süresinin toplanmasıyla bulunur. Formül: İşçilik Maliyeti = SAM (dakika) × Dakika Başı İşçilik Ücreti. Dakika başı işçilik ücreti, işletmenin günlük işçilik ücretinin (operatör maaşı + sosyal yükler) günlük çalışma dakikasına (genellikle 480 dakika = 8 saat) bölünmesiyle bulunur. Örneğin bir ürünün toplam SAM'i 12 dakika ve dakika başı işçilik ücreti 0,15 USD ise, işçilik maliyeti = 12 × 0,15 = 1,8 USD/adet olur. Hat verimliliği düştükçe aynı SAM'lik ürün için fiilen harcanan süre artar, bu da gerçekleşen işçilik maliyetinin planlanandan yüksek çıkmasına yol açar.",
  },
  {
    id: 'genel-gider-payi',
    baslik: 'Genel Gider Payı (Overhead)',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'genel gider',
      'overhead',
      'kira',
      'elektrik',
      'yönetim',
      'amortisman',
      'yüzde',
    ],
    icerik:
      'Genel gider (overhead), bir ürünün doğrudan üretimiyle ilgili olmayan ama işletmenin faaliyetini sürdürebilmesi için katlandığı giderlerdir: fabrika kirası, elektrik/su/doğalgaz, yönetim ve idari personel maaşları, makine amortismanı, sigorta, bakım-onarım gibi kalemler bu kategoriye girer. Bu giderler belirli bir ürüne doğrudan yüklenemediği için, genellikle toplam maliyetin (hammadde + işçilik) belirli bir yüzdesi olarak ürün maliyetine eklenir; hazır giyim sektöründe bu oran genellikle %10-20 aralığındadır, işletmenin sabit gider yapısına ve üretim hacmine göre değişir. Örneğin hammadde + işçilik maliyeti toplamı 10 USD olan bir üründe %15 genel gider payı uygulanırsa, genel gider payı = 10 × 0,15 = 1,5 USD olur ve toplam maliyete eklenir. Düşük üretim hacminde sabit giderler daha az ürüne bölüneceği için genel gider payı oranı yükselir; yüksek hacimde ise bu oran düşer (ölçek ekonomisi).',
  },
  {
    id: 'toplam-maliyet-formulu',
    baslik: 'Toplam Maliyet Formülü',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'toplam maliyet',
      'toplam birim maliyet',
      'formül',
      'örnek hesaplama',
    ],
    icerik:
      'Toplam birim maliyet, bir ürünün hammadde, işçilik ve genel gider bileşenlerinin toplanmasıyla bulunur: Toplam Birim Maliyet = Hammadde Maliyeti + İşçilik Maliyeti + Genel Gider Payı. Örnek bir hesaplama: bir tişört için hammadde maliyeti (kumaş + aksesuar) 5,4 + 0,6 = 6 USD, işçilik maliyeti 1,8 USD ise, hammadde + işçilik toplamı 7,8 USD eder. Bu toplama %15 genel gider payı uygulanırsa, genel gider = 7,8 × 0,15 = 1,17 USD olur ve toplam birim maliyet = 7,8 + 1,17 = 8,97 USD/adet olarak bulunur. Bu toplam birim maliyet, henüz kâr marjı içermez; işletmenin bu üründen kâr elde edebilmesi için satış fiyatının bu toplam maliyetin üzerinde belirlenmesi gerekir.',
  },
  {
    id: 'kar-marji-ve-satis-fiyati',
    baslik: 'Kâr Marjı ve Satış Fiyatı',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'kar marjı',
      'kâr marjı',
      'satış fiyatı',
      'formül',
      'fason üretim',
      'yüzde',
    ],
    icerik:
      'Satış fiyatı, toplam birim maliyetin üzerine işletmenin hedeflediği kâr marjının eklenmesiyle belirlenir: Satış Fiyatı = Toplam Maliyet × (1 + Kâr Marjı Oranı). Örneğin toplam birim maliyeti 8,97 USD olan bir üründe %20 kâr marjı hedefleniyorsa, satış fiyatı = 8,97 × (1 + 0,20) = 8,97 × 1,20 = 10,76 USD olur. Kâr marjı oranı sektöre, ürün karmaşıklığına, müşteri ilişkisine ve pazar koşullarına göre değişir; fason (contract manufacturing) üretim yapan hazır giyim işletmelerinde kâr marjı genellikle %10-25 aralığındadır. Basit, yüksek hacimli ürünlerde (tişört gibi) rekabet daha yoğun olduğundan kâr marjı düşük tutulabilir; karmaşık, düşük hacimli veya özel tasarım ürünlerde daha yüksek kâr marjı uygulanabilir. Kâr marjının çok düşük belirlenmesi işletmenin sürdürülebilirliğini riske atarken, çok yüksek belirlenmesi siparişin rakiplere kaptırılmasına yol açabilir.',
  },
  {
    id: 'fob-fiyat-nedir',
    baslik: 'FOB Fiyat Nedir?',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'fob',
      'free on board',
      'fiyat',
      'nedir',
      'uluslararası ticaret',
      'teslim şekli',
    ],
    icerik:
      'FOB (Free On Board — gemiye/araca teslim), malın ihracatçı ülkedeki limanda gemiye (veya kara taşımacılığında araca) yüklenene kadarki tüm maliyetleri satıcının üstlendiği, bu noktadan sonraki taşıma ve sigorta maliyetlerinin ise alıcıya geçtiği bir uluslararası teslim şeklidir (Incoterms). FOB fiyat; üretim maliyeti (hammadde + işçilik + genel gider + kâr marjı), iç nakliye (fabrikadan limana taşıma) ve gümrük çıkış işlemlerinin tamamını kapsar. Hazır giyim ve tekstil ihracatında en yaygın kullanılan teslim şeklidir çünkü hem üretici hem alıcı için sorumluluk sınırı nettir: üretici malı gemiye kadar güvenle teslim etmekle, alıcı ise gemiden sonraki navlun, sigorta ve ithalat işlemleriyle sorumludur. Bir sipariş teklifi verilirken "FOB fiyat" denildiğinde, bu fiyata uluslararası deniz/hava taşımacılığı, gümrük vergisi veya alıcı ülkedeki teslim maliyetlerinin dahil olmadığı unutulmamalıdır.',
  },
  {
    id: 'cmt-fob-fark',
    baslik: 'CMT ve FOB Fiyatlandırma Farkı',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'cmt',
      'cut make trim',
      'fob',
      'fark',
      'buyer kumaş',
      'fiyatlandırma yöntemi',
    ],
    icerik:
      'CMT (Cut-Make-Trim — kesim-dikim-trim) ve FOB, hazır giyim sektöründe kullanılan iki farklı fiyatlandırma ve iş modelidir. CMT fiyatlandırmada üretici yalnızca kesim, dikim ve trim (son işlem/paketleme) işçiliğini fiyatlandırır; kumaş, astar, aksesuar gibi tüm hammaddeler alıcı (buyer) tarafından temin edilip fabrikaya gönderilir, üretici sadece kendi işçiliğinden sorumludur ve fiyata hammadde maliyeti dahil değildir. FOB fiyatlandırmada ise üretici hem hammaddeyi tedarik eder hem de üretimi gerçekleştirir; fiyata hammadde, işçilik, genel gider ve kâr marjının tamamı dahildir, üretici mali riskin ve tedarik zincirinin tamamından sorumludur. Hangi modelin kullanılacağı alıcı-üretici ilişkisine göre belirlenir: büyük, kendi tedarik ağına sahip markalar genellikle CMT tercih ederek hammadde maliyetini ve kalitesini kendileri kontrol eder; üreticinin güçlü tedarikçi ilişkileri ve sermaye gücü varsa FOB modeli tercih edilir çünkü üretici için daha yüksek ciro ve kâr potansiyeli sunar, ancak daha fazla risk ve işletme sermayesi gerektirir.',
  },
  {
    id: 'kurun-maliyete-etkisi',
    baslik: 'Döviz Kurunun Maliyete Etkisi',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'döviz kuru',
      'kur',
      'usd',
      'eur',
      'maliyet',
      'kur riski',
      'forward sözleşme',
    ],
    icerik:
      'Hazır giyim üretiminde kumaş ve aksesuarların önemli bir kısmı USD veya EUR bazında fiyatlandırılır (özellikle ithal kumaşlar, özel aksesuarlar), bu da döviz kurundaki dalgalanmaların üretim maliyetini doğrudan etkilemesine yol açar. Sipariş alınırken belirlenen maliyet hesaplaması ile üretimin fiilen gerçekleştiği veya hammaddenin satın alındığı tarihteki kur arasında fark oluşursa, planlanan kâr marjı daralabilir veya siparişin zarar etmesine bile yol açabilir; özellikle teklif verilmesi ile teslimat arasında uzun süre geçen siparişlerde bu risk artar. Kur riskini yönetmek için birkaç yöntem kullanılır: Forward sözleşme, gelecekteki bir tarihte belirli bir kurdan döviz alım/satımını bugünden garanti altına alan bankacılık ürünüdür; bu sayede hammadde ödemesi ileride yapılacak olsa bile maliyet bugünden sabitlenir. Sabit kur anlaşması, tedarikçiyle veya alıcıyla belirli bir dönem için sabit bir kur üzerinden fiyatlandırma yapma konusunda anlaşmaktır. Bazı işletmeler ayrıca fiyat tekliflerine kur güncelleme maddesi ekleyerek, kur belirli bir eşiğin üzerinde hareket ederse fiyatın yeniden görüşülebileceğini sözleşmeye dahil eder.',
  },
  {
    id: 'kar-zarar-analizi',
    baslik: 'Sipariş Kâr/Zarar Analizi',
    kategori: 'maliyet',
    anahtarKelimeler: [
      'kar zarar analizi',
      'kâr zarar analizi',
      'gerçekleşen maliyet',
      'planlanan maliyet',
      'fire',
      '2. kalite',
      'kârlılık',
    ],
    icerik:
      'Bir siparişin gerçekten kârlı olup olmadığını anlamak için, sipariş alınırken hesaplanan planlanan maliyet ile üretim tamamlandıktan sonra fiilen oluşan gerçekleşen maliyet karşılaştırılır. Planlanan maliyet, teklif aşamasında standart sarfiyat oranları, hedeflenen hat verimliliği ve öngörülen fire/2. kalite oranlarıyla hesaplanır; gerçekleşen maliyet ise fiili hammadde tüketimini, fiili çalışılan süreyi ve fiili fire/2. kalite adetlerini yansıtır. Fire ve 2. kalite oranı, kârlılığı doğrudan etkileyen kritik faktörlerdir: yüksek fire oranı, aynı miktarda satılabilir ürün elde etmek için daha fazla hammadde ve işçilik harcanması anlamına gelir — kesilen kumaşın bir kısmı hatalı üretim nedeniyle tamamen israf olur ve bu maliyet hiçbir gelir getirmeden işletmenin üzerinde kalır. Yüksek 2. kalite oranı ise ürünlerin indirimli fiyattan satılmasına yol açarak planlanan gelirin altında kalınmasına neden olur. Bu nedenle bir siparişin kâr/zarar analizinde yalnızca hammadde ve işçilik maliyetine değil, gerçekleşen fire ve 2. kalite oranlarına da bakılmalıdır; planlanandan yüksek fire/2. kalite oranı görüldüğünde, o siparişin görünürdeki kâr marjı gerçekte çok daha düşük veya negatif olabilir.',
  },
  {
    id: 'kumas-turleri-genel',
    baslik: 'Yaygın Kumaş Türleri ve Özellikleri',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'kumaş türleri',
      'keten',
      'pamuklu',
      'yünlü',
      'ipek',
      'kaşmir',
      'akrilik',
      'naylon',
      'poliamid',
      'polyester',
      'saten',
      'angora',
    ],
    icerik:
      'Hazır giyimde kullanılan kumaşlar, elyaf yapılarına göre farklı özellikler ve kullanım alanlarına sahiptir. Keten, doğal bir bitkisel elyaftır; serin tutar, nefes alır, yaz giyiminde tercih edilir ancak kolayca kırışır. Pamuklu kumaş, en yaygın doğal elyaftır; nefes alır, cilde yumuşak gelir, terletmez, ancak yıkamada çekme (shrinkage) eğilimi gösterir; tişört, iç giyim, gömlek gibi ürünlerde yaygındır. Yünlü kumaş hayvansal bir elyaftır; sıcak tutar, doğal elastikiyeti vardır, kışlık dış giyim ve takım elbiselerde kullanılır. İpek, ipek böceği kozasından elde edilen hassas ve parlak bir elyaftır; lüks abiye ve gömleklerde tercih edilir ama çabuk solar, kolay yanar ve nem tutma kapasitesi düşüktür, özel bakım gerektirir. Kaşmir, keçi tüyünden elde edilen çok yumuşak ve lüks bir elyaftır; kazak ve şallarda kullanılır, hassas yapısı nedeniyle özel bakım (kuru temizleme, elde yıkama) gerektirir. Akrilik, yünün ucuz bir sentetik alternatifidir; hafif ve sıcak tutar ama statik elektriklenmeye eğilimlidir, ekonomik kazak/hırka üretiminde kullanılır. Naylon (poliamid), dayanıklı, hafif ve esnek bir sentetik elyaftır; çorap, iç giyim ve spor giyimde yaygındır. Polyester, en yaygın sentetik elyaftır; dayanıklı, az kırışan ve ucuz bir malzemedir ancak nefes almadığı için terletebilir; genellikle pamukla karıştırılarak kullanılır. Saten, parlak yüzeyli, kaygan ve dökümlü bir kumaş dokusudur (elyaf değil, örgü/dokuma türüdür); abiye ve gecelik gibi ürünlerde tercih edilir. Angora, tavşan tüyünden elde edilen çok yumuşak, ince ve tüylü bir elyaftır; kazak ve aksesuarlarda kullanılır, dökülme eğilimi gösterebilir.',
  },
  {
    id: 'kaskorse-ribana-farki',
    baslik: 'Ribana ve Kaşkorse Farkı',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'kaşkorse',
      'ribana',
      'fark',
      'nedir',
      'çift katlı',
      'boyuna çizgi',
      'yaka',
      'kol ağzı',
      'esnek',
    ],
    icerik:
      'Ribana, silindir (cylinder) ve kapak (rib) iğnelerinin çapraz/karşılıklı yerleşimiyle örülen çift katlı bir örme kumaş türüdür; düz (right) ve ters (wrong) ilmeklerin belirli bir sırayla dizilmesiyle oluşur ve bu yapı kumaşa boyuna esneme kabiliyeti ve sıkı bir tutuş kazandırır. Kaşkorse ise ribana örgüsünün bir varyasyonudur: ribana örgüsünde belirli iğnelerin (genellikle her üçüncü iğnenin) devre dışı bırakılmasıyla elde edilir. Bu iğne iptali sayesinde kaşkorsede ribanaya göre daha belirgin ve geniş aralıklı boyuna çizgiler oluşur; ayrıca daha az iğne kullanıldığı için kaşkorse, ribanaya göre daha az sıkı ve daha esnek bir yapıya sahiptir. Görsel olarak kaşkorsenin boyuna oluk/çizgileri ribanaya göre daha kalın ve seyrek görünür. Her iki örgü türü de kumaşın kenar bölgelerinde şekil kaybını önlemek ve esneklik sağlamak amacıyla yaka, kol ağzı ve etek bandı gibi bileşenlerde yaygın olarak kullanılır; ayrıca kaşkorse tek başına kumaş olarak da tişört, kazak gibi ürünlerin tamamında tercih edilebilir.',
  },
  {
    id: 'iki-uc-iplik-kumas-farki',
    baslik: 'İki İplik ve Üç İplik Kumaş Farkı',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'iki iplik',
      'üç iplik',
      'fark',
      'fransız',
      'şardon',
      'şardonlu',
      'sweatshirt',
      'eşofman',
    ],
    icerik:
      'İki iplik kumaş, örme yapısında iki farklı iplik sisteminin kullanıldığı, ön ve arka yüzü birbirinden farklı görünen, nispeten ince bir örme kumaş türüdür; hafif ve nefes alan yapısı nedeniyle tişört ve iç giyim gibi ince ürünlerde tercih edilir. Üç iplik kumaş (Fransız kumaşı veya şardonlu kumaş olarak da bilinir) ise iki ana iplik sistemine ek olarak üçüncü bir tüylendirme (şardon) ipliği içerir; bu ilave iplik kumaşın iç yüzeyinde tüylü/pamuksu bir doku oluşturur ve kumaşı hem daha kalın hem de daha sıcak tutan bir yapıya kavuşturur. Bu nedenle üç iplik kumaşlar eşofman altı-üstü, sweatshirt, kapüşonlu sweatshirt (hoodie) gibi kışlık ve rahat giyim ürünlerinde yaygın olarak kullanılır. İki iplik kumaşın dış yüzeyi düzgün ve pürüzsüzken, üç iplik kumaşın iç yüzeyi genellikle tüylü/şardonlu bir görünüme sahiptir; bu tüylü yüzey hem yalıtım sağlar hem de dokunuşta yumuşak bir his verir.',
  },
  {
    id: 'orme-dokuma-farki',
    baslik: 'Örme ve Dokuma Kumaş Farkı',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'örme',
      'dokuma',
      'fark',
      'çözgü',
      'atkı',
      'esneklik',
      'stabilite',
    ],
    icerik:
      'Dokuma kumaş, çözgü (boyuna, tezgahta sabit gerili duran iplikler) ve atkı (enine, mekik ile çözgü ipliklerinin arasından geçirilen iplikler) ipliklerinin birbirinin altından ve üstünden dik açıyla geçirilmesiyle oluşturulur; bu yapı kumaşa stabil, az esneyen ve boyutsal olarak dayanıklı bir karakter kazandırır, bu nedenle gömlek, pantolon, ceket gibi form koruması gereken ürünlerde tercih edilir. Örme kumaş ise ipliklerin iğneler yardımıyla art arda ilmek hâline getirilip birbirine bağlanmasıyla oluşturulur; bu ilmek yapısı kumaşa doğal bir esneklik kazandırır, bu yüzden tişört, kazak, iç giyim gibi vücuda oturması ve hareket serbestliği gereken ürünlerde kullanılır. İki kumaş türü arasındaki temel farklar şöyle özetlenebilir: dokuma kumaşlar sökülmeye ve yırtılmaya karşı genellikle daha dayanıklıdır ve iplik kaçması riski taşımaz, ancak esneklikleri sınırlıdır (kumaşın çapraz kesim yönünde biraz esneme olabilir, ancak örme kadar değil); örme kumaşlar ise konfor, esneklik ve vücuda uyum açısından daha üstündür, ancak bir ilmek koptuğunda kumaş boyunca "kaçma" (run) riski taşıyabilir ve dokumaya göre şekil kaybına (deformasyon) daha yatkındır.',
  },
  {
    id: 'polyester-kumas-ozellikleri',
    baslik: 'Polyester Kumaşın Özellikleri',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'polyester',
      'özellikleri',
      'sentetik',
      'dayanıklılık',
      'terletme',
      'statik elektrik',
      'pamuk karışımı',
    ],
    icerik:
      'Polyester, petrol türevi hammaddelerden üretilen sentetik bir elyaftır ve hazır giyim sektöründe en yaygın kullanılan elyaflardan biridir. Olumlu özellikleri arasında yüksek dayanıklılık, kolay kırışmama, hızlı kuruma, iyi renk haslığı (boyanın solmaya karşı direnci) ve nispeten düşük maliyet sayılabilir; bu özellikler polyesteri spor giyim, dış giyim astarları ve dayanıklılığın öncelikli olduğu ürünler için uygun kılar. Dezavantajları ise doğal elyaflara kıyasla nefes almaması, bu nedenle vücut ısısını ve nemi hapsederek terletme eğiliminde olmasıdır; ayrıca kuru ortamlarda statik elektriklenmeye yatkındır ve doğada biyolojik olarak çözünmesi (parçalanması) onlarca-yüzlerce yıl sürebilir, bu da çevresel bir dezavantaj oluşturur. Bu nedenlerle polyester çoğu zaman saf hâlde değil, pamukla karıştırılarak kullanılır (polyester-pamuk karışımı); bu karışım, polyesterin dayanıklılık ve az kırışma özelliğiyle pamuğun nefes alabilirlik ve konfor özelliğini bir araya getirerek her iki elyafın da avantajlarından yararlanmayı amaçlar.',
  },
  {
    id: 'elyaf-karisimlari-nedir',
    baslik: 'Elyaf Karışımları Nedir?',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'elyaf karışımı',
      'karışım',
      'nedir',
      'polyester pamuk',
      'yün akrilik',
      'karışım oranı',
    ],
    icerik:
      'Elyaf karışımı, iki veya daha fazla farklı elyafın (örneğin pamuk ve polyester, ya da yün ve akrilik) belirli oranlarda bir araya getirilerek tek bir iplik veya kumaşta birleştirilmesidir. Amaç, farklı elyafların olumlu özelliklerini bir araya getirmek, maliyeti optimize etmek veya kumaşın performansını (dayanıklılık, bakım kolaylığı, konfor) artırmaktır. Örneğin %65 polyester - %35 pamuk karışımlı bir kumaş, polyesterin dayanıklılık ve az kırışma özelliği ile pamuğun nefes alabilirlik ve yumuşaklık özelliğini birleştirir; bu karışım saf pamuğa göre daha az kırışır, daha hızlı kurur ve genellikle daha ucuza mal olur, ancak saf pamuk kadar nefes alıcı olmayabilir. Benzer şekilde yün-akrilik karışımları, yünün sıcaklık tutma özelliğini korurken akrilik sayesinde maliyeti düşürür ve bakımı kolaylaştırır (yün genellikle kuru temizleme gerektirirken akrilik karışımlı ürünler makinede yıkanabilir olabilir). Karışım oranı kumaş/ürün etiketinde yüzde olarak belirtilir (örn. "%65 Polyester %35 Pamuk") ve bu oran, ürünün bakım talimatlarını (yıkama sıcaklığı, ütüleme, kuru temizleme gerekliliği) doğrudan etkiler.',
  },
  {
    id: 'poliamid-naylon-elyafi',
    baslik: 'Poliamid (Naylon) Elyafının Özellikleri',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'poliamid',
      'naylon',
      'elyaf',
      'özellikleri',
      'elastan',
      'mayo',
      'tayt',
      'aşınma dayanımı',
    ],
    icerik:
      'Poliamid (ticari adıyla naylon), sentetik bir elyaf türüdür ve hazır giyimde özellikle dayanıklılık ve esneklik gerektiren ürünlerde tercih edilir. En belirgin özelliği çok yüksek aşınma ve yırtılma dayanımıdır; aynı zamanda hafif, esnek bir yapıya sahiptir ve nemi hızlı emip çabuk kurur, bu da onu spor ve aktif giyim için uygun kılar. Poliamid; çorap, iç giyim, spor giyim ve dış giyim astarlarında yaygın olarak kullanılır. Özellikle elastan (spandex/lycra) ile karıştırıldığında yüksek esneklik gerektiren ürünlerde (mayo, tayt, spor sütyeni gibi) tercih edilen temel elyaf haline gelir; poliamidin dayanıklılığı ile elastanın esnekliği birleşerek vücuda tam oturan, uzun ömürlü kumaşlar oluşturur. Poliamidin dikkat edilmesi gereken bir zayıf noktası, uzun süre doğrudan güneş ışığına (UV) maruz kalması durumunda sararma ve mukavemet kaybı (zayıflama) gösterebilmesidir; bu nedenle poliamid ağırlıklı ürünlerin uzun süre güneşte bırakılmaması önerilir.',
  },
  {
    id: 'selanik-kumas-nedir',
    baslik: 'Selanik Kumaş Nedir?',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'selanik kumaş',
      'nedir',
      'terlik',
      'çanta astarı',
      'ekonomik',
    ],
    icerik:
      'Selanik kumaş, genellikle pamuklu elyaftan üretilen, hafif ile orta gramaj aralığında, sık dokulu bir kumaş türüdür. Sıkı dokuma yapısı sayesinde nispeten dayanıklı bir yüzey sunar ve ekonomik bir maliyetle üretilebilir. Hazır giyim ve aksesuar sektöründe en yaygın kullanım alanları terlik yüzeyi/astarı, çanta astarı ve günlük giyim ürünleridir; ürünün gördüğü işlevde hem dayanıklılık hem de düşük maliyet önceliği olduğunda selanik kumaş tercih edilen bir seçenektir.',
  },
  {
    id: 'krep-orgu-yontemleri',
    baslik: 'Krep Örgü Elde Etme Yöntemleri',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'krep',
      'krep örgü',
      'yöntemleri',
      'büküm',
      'abiye',
      'dökümlü',
    ],
    icerik:
      'Krep örgü, kumaş yüzeyinde düzensiz, ince taneli ve hafif buruşuk görünümlü bir doku elde etmek amacıyla kullanılan özel örgü/doku tekniklerinin genel adıdır. Bu görünüm dört farklı temel yöntemle elde edilebilir: 1) İlmek hareketlerinin yer değiştirilmesi — bir örgü yapısındaki ilmeklerin normal düzenli dizilişinin bilinçli olarak bozulmasıyla yüzeyde düzensizlik yaratılır; 2) Farklı örgülerin bir araya getirilmesi — birden fazla farklı örgü türünün belirli bir düzende birleştirilmesiyle yüzeyde kontrast ve tanecikli bir doku oluşturulur; 3) Yüksek büküm oranlı krep iplikleri kullanma — ipliğin kendisine normalden çok daha fazla büküm (twist) verilerek üretilmesi, bu yüksek büküm ipliğin dokusuna doğal bir buruşukluk/tanecikli görünüm kazandırır; 4) S ve Z yönünde farklı büküm yönlerine sahip ipliklerin sırayla dizilmesi — zıt yönde bükülmüş ipliklerin yan yana kullanılması, kumaş yüzeyinde ince dalgalanmalar oluşturarak krep etkisi yaratır. Krep örgüyle elde edilen kumaşlar dökümlü bir duruş sergiler ve kolay buruşma göstermez; bu özellikleri nedeniyle abiye giyim ve şık günlük kıyafetlerde sıklıkla tercih edilir.',
  },
  {
    id: 'dokuma-genel-bilgisi',
    baslik: 'Dokuma Kumaş Genel Bilgisi',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'dokuma',
      'çözgü',
      'atkı',
      'bezayağı',
      'dimi',
      'saten',
      'örgü türleri',
    ],
    icerik:
      'Dokuma kumaş, çözgü ipliklerinin (kumaşın boyuna doğrultusunda, dokuma tezgahında sabit ve gergin tutulan iplikler) ile atkı ipliklerinin (enine doğrultuda, mekik yardımıyla çözgü iplikleri arasından geçirilen iplikler) belirli bir düzene göre birbirinin altından ve üstünden geçirilmesiyle oluşturulur. Bu geçiş düzeni, dokuma örgü türünü belirler; üç temel dokuma örgüsü vardır: Bezayağı (plain weave), en basit ve en sağlam dokuma türüdür; her atkı ipliği çözgü ipliklerinin bir altından bir üstünden geçer, düz ve pürüzsüz bir görünüm sunar, popelin ve patiska gibi kumaşlarda kullanılır. Dimi (twill weave), atkı ve çözgü ipliklerinin kaydırmalı geçişiyle kumaş yüzeyinde çapraz/diyagonal çizgili bir desen oluşturur, gabardin ve kot kumaşı gibi dayanıklı kumaşlarda tercih edilir. Saten (satin weave), atkı veya çözgü ipliklerinden birinin uzun atlamalarla diğerinin üzerinden geçtiği bir örgü türüdür; bu uzun atlamalar yüzeyde parlak ve pürüzsüz bir görünüm ile dökümlü bir tutuş sağlar. Dokunan kumaşın eni, kullanılan dokuma tezgahının fiziksel genişliğine bağlıdır; standart tezgahlar genellikle 140-160 cm aralığında kumaş üretir, ancak daha dar veya geniş tezgahlar da mevcuttur.',
  },
  {
    id: 'tekstil-terimleri-sozlugu',
    baslik: 'Sık Kullanılan Tekstil Terimleri Sözlüğü',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'tekstil terimleri',
      'sözlük',
      'denye',
      'haslık',
      'numara',
      'merserize',
      'çekmezlik',
      'metraj',
      'tuşe',
      'gramaj',
    ],
    icerik:
      'Tekstil ve hazır giyim sektöründe sık kullanılan bazı temel terimler şunlardır: Denye, ipliğin inceliğini/kalınlığını gösteren bir ölçü birimidir; 9.000 metre uzunluğundaki ipliğin gram cinsinden ağırlığına eşittir, denye değeri düştükçe iplik incelir. Haslık, boyanan bir kumaşın rengini ışığa, yıkamaya, sürtünmeye veya tere karşı ne kadar koruduğunu gösteren dayanıklılık ölçüsüdür (örn. yıkama haslığı, ışık haslığı). Numara (Ne veya Nm sistemi), iplik kalınlığını gösteren bir numaralama sistemidir; sistem türüne göre iplik kalınlığı ile numara arasındaki ilişki değişebilir. Merserize, pamuklu ipliğe veya kumaşa kimyasal (genellikle kostik soda) işlem uygulanarak parlaklık, mukavemet ve boya alma kabiliyeti kazandırılan bir bitim (finishing) işlemidir. Çekmezlik, kumaşın yıkama ve kullanım sırasında boyut değiştirmesini (küçülmesini) en aza indiren bir bitim işlemidir/özelliğidir. Metraj, bir kumaş topunun veya parçasının metre cinsinden uzunluğunu ifade eder. Tuşe, kumaşın elle dokunulduğunda hissedilen yumuşaklık, sertlik veya pürüzsüzlük gibi dokusal özelliğidir. Gramaj, kumaşın 1 metrekaresinin gram cinsinden ağırlığıdır (g/m²) ve kumaşın kalınlığı/ağırlığı hakkında standart bir karşılaştırma ölçüsü sağlar.',
  },
  {
    id: 'endustriyel-dikis-iplikleri',
    baslik: 'Endüstriyel Dikiş İplikleri Türleri',
    kategori: 'dikim',
    anahtarKelimeler: [
      'dikiş ipliği',
      'endüstriyel',
      'pamuk iplik',
      'polyester iplik',
      'naylon iplik',
      'core-spun',
      'iplik seçimi',
    ],
    icerik:
      'Endüstriyel dikişte kullanılan iplikler, kumaş tipine ve dikişin işlevine göre farklı elyaf türlerinden üretilir. Pamuk iplik, doğal bir dikiş ipliğidir; ütüye karşı dayanıklıdır ve esnek olmayan (dokuma) kumaşlarda tercih edilir, ancak polyester ipliğe göre daha az dayanıklı ve daha az esnektir. Polyester iplik, endüstride en yaygın kullanılan dikiş ipliğidir; yüksek dayanıklılığı, aşınmaya direnci ve hemen her kumaş türünde (hem dokuma hem örme) kullanılabilir olması nedeniyle tercih edilir. Naylon iplik, yüksek esneklik gerektiren dikişlerde (deri, dış giyim, esnek kumaşlar) kullanılır; naylonun elastik yapısı, kumaşın esnediği dikiş noktalarında ipliğin kopmasını önler. Core-spun (çekirdekli) iplik, dayanıklı bir polyester çekirdek etrafına pamuk lifiyle kaplama yapılarak üretilir; bu yapı hem polyesterin dayanıklılığını hem de pamuğun doğal görünümünü ve ütü dayanımını bir arada sunar, bu nedenle çok yönlü kullanıma uygundur. Doğru iplik seçimi kumaşın kalınlığına, elyaf tipine ve dikiş türüne (düz dikiş, overlok, reçme vb.) göre yapılmalıdır; yanlış iplik-kumaş-iğne kombinasyonu dikiş atlamasına, iplik kopmasına veya kumaşta hasara yol açabilir.',
  },
  {
    id: 'dikis-makinesi-aksakliklari',
    baslik: 'Dikiş Makinesinde Sık Görülen Aksaklıklar',
    kategori: 'dikim',
    anahtarKelimeler: [
      'dikiş makinesi',
      'aksaklık',
      'arıza',
      'iplik kopması',
      'dikiş atlaması',
      'iğne',
      'bakım',
    ],
    icerik:
      'Dikiş makinelerinde üretim sırasında sık karşılaşılan aksaklıklar ve olası nedenleri şöyle özetlenebilir: İplik kopması, genellikle yanlış iplik gerginliği ayarı, körelmiş veya hasarlı bir iğne ya da düşük kaliteli/uygunsuz iplik kullanımından kaynaklanır. Dikiş atlaması (bazı ilmeklerin oluşmaması), iğne ile iplik kalınlığının uyumsuz seçilmesinden veya iğnenin eğrilmiş/hasarlı olmasından kaynaklanabilir. Kumaş büzülmesi veya dalgalanması, aşırı sıkı iplik gerginliğinden ya da baskı ayağının (presser foot) kumaşa uyguladığı basıncın yanlış ayarlanmasından ortaya çıkabilir. Alt-üst iplik dengesizliği, genellikle masura (alt iplik bobini) gerginliğinin hatalı ayarlanmış olmasından kaynaklanır ve dikişin bir yüzünde diğerine göre daha belirgin görünmesine yol açar. Makinede aşırı ses veya titreşim ise çoğunlukla yağlama eksikliği ya da mekanik parçalardaki aşınmaya işaret eder. Bu aksaklıkların büyük bir kısmı, düzenli makine bakımı ve kumaş-iplik-iğne kombinasyonunun doğru seçilmesiyle önlenebilir.',
  },
  {
    id: 'masura-gerginligi-ayari',
    baslik: 'Masura Gerginliği Ayarı',
    kategori: 'dikim',
    anahtarKelimeler: [
      'masura',
      'masura gerginliği',
      'gerginlik',
      'ayarlanır',
      'alt iplik',
      'üst iplik',
      'dikiş makinesi',
      'vida',
    ],
    icerik:
      'Masura, dikiş makinesinin alt kısmında yer alan ve alt ipliği taşıyan küçük bobin/makaradır; sağlıklı bir dikiş için masuradan gelen alt iplik ile üstten gelen iplik arasında dengeli bir gerginlik olması gerekir. Masura gerginliği çok sıkı ayarlanmışsa, dikiş yüzeyi üstten çekilir ve kumaş dalgalanır/büzülür; gerginlik çok gevşek bırakılmışsa alt iplik kumaşın üst yüzeyinde görünür hâle gelir ve dikiş gevşek/düzensiz olur. Gerginlik ayarı, masuranın yerleştirildiği masura yuvası (bobin case) üzerindeki küçük bir vida ile yapılır: vida saat yönünde çevrildiğinde gerginlik artar, saat yönünün tersine çevrildiğinde gerginlik azalır; ayar genellikle çok küçük dönüşlerle (çeyrek tur gibi) yapılmalıdır çünkü hassas bir ayardır. Doğru gerginliğe ulaşıldığından emin olmak için kumaş üzerinde bir deneme dikişi yapılmalı ve dikiş çözülerek üst ile alt ipliğin kumaşın tam ortasında (ne üstte ne altta) dengeli şekilde birbirine kenetlendiği gözle kontrol edilmelidir; iplikler ortada buluşuyorsa gerginlik doğru ayarlanmış demektir.',
  },
  {
    id: 'azo-boyar-maddeler',
    baslik: 'Azo Boyar Maddeler Nedir?',
    kategori: 'kimya-boyama',
    anahtarKelimeler: [
      'azo boyar madde',
      'azo',
      'boyar madde',
      'nedir',
      'kanserojen',
      'aromatik amin',
      'ppm',
      'oeko-tex',
    ],
    icerik:
      "Azo boyar maddeler, yapısında bir veya daha fazla azo grubu (-N=N-) içeren sentetik organik boyar madde sınıfıdır; dünyada üretilen sentetik boyaların büyük bir kısmı bu sınıfa girer çünkü üretimi görece ucuzdur ve çok çeşitli, canlı renk tonları elde etmeyi sağlar. Tekstil boyamada yaygın kullanılmasının nedeni geniş renk paletine ek olarak farklı elyaf tiplerine uyarlanabilir formülasyonlara sahip olmasıdır. Ancak bazı azo boyar maddeler, belirli koşullar altında (örneğin ciltle uzun süreli temas veya metabolik parçalanma) indirgenerek aromatik amin bileşiklerine dönüşebilir; bu aromatik aminlerden bir kısmının kanserojen (kanser yapıcı) etkisi bilimsel olarak tespit edilmiştir. Bu nedenle Avrupa Birliği ve Türkiye'de belirli azo boyar maddelerin tekstil ve deri ürünlerinde kullanımı yasal düzenlemelerle sınırlandırılmıştır; genel kabul gören limit, serbest aromatik amin miktarının 30 ppm (milyonda parça) değerini aşmamasıdır. Özellikle AB'ye ihracat yapan tekstil üreticileri için bu limitlere uyum zorunludur ve alıcı firmalar genellikle akredite laboratuvarlardan alınmış azo boyar madde test raporu talep eder; test raporu olmayan veya limiti aşan ürünler gümrükte veya denetimlerde reddedilebilir.",
  },
  {
    id: 'dispers-boyama-nedir',
    baslik: 'Dispers Boyama Nedir?',
    kategori: 'kimya-boyama',
    anahtarKelimeler: [
      'dispers boyama',
      'nedir',
      'polyester boyama',
      'disperse',
      'hidrofobik',
      'boya partikülü',
    ],
    icerik:
      'Dispers boyama, suda çözünmeyen ve bu nedenle su içinde ince partiküller hâlinde dağıtılarak (disperse edilerek) uygulanan boyar maddelerle yapılan bir boyama yöntemidir. Bu yöntem özellikle polyester gibi sentetik elyafların boyanmasında kullanılır çünkü polyester lifleri hidrofobiktir (su sevmez) ve suda çözünen boyar maddelerle yeterince güçlü bir bağ kuramaz; dispers boya partikülleri ise lif yapısına fiziksel olarak nüfuz ederek renklenmeyi sağlar. Dispers boyama genellikle yüksek sıcaklıkta (yaklaşık 130°C civarında), basınçlı kapalı boyama kazanlarında yapılır çünkü bu sıcaklık polyester lifinin moleküler yapısını gevşeterek boya partiküllerinin life nüfuz etmesini kolaylaştırır; alternatif olarak taşıyıcı (carrier) kimyasallar kullanılarak daha düşük sıcaklıkta da boyama yapılabilir, ancak bu yöntem daha az tercih edilir. Boya partikül boyutunun küçük ve boyama banyosu içinde homojen dağılmış olması, hem elde edilen rengin verimini (koyuluğunu) hem de yıkama ve sürtünme haslığını doğrudan etkiler; partiküllerin topaklanması (agregasyon) durumunda leke, benek veya düzensiz renk sorunları ortaya çıkabilir.',
  },
  {
    id: 'tekstilde-ph-degeri',
    baslik: 'Tekstilde pH Değerinin Önemi',
    kategori: 'kimya-boyama',
    anahtarKelimeler: [
      'ph',
      'ph değeri',
      'tekstilde ph',
      'neden önemli',
      'asit baz',
      'oeko-tex',
      'cilt',
      'nötr',
    ],
    icerik:
      "pH, bir çözeltinin asidik mi yoksa bazik (alkali) mi olduğunu gösteren, 0 ile 14 arasında değişen bir ölçü birimidir; 7 değeri nötr kabul edilir, 7'nin altı asidik, üstü bazik anlamına gelir. Tekstil üretiminin hemen her aşamasında (yıkama, boyama, apre/bitim işlemleri) pH kontrolü kritik önem taşır çünkü uygun olmayan pH koşulları lif yapısında hasara (özellikle yün ve ipek gibi hassas doğal liflerde), boyanın life düzgün bağlanamamasından kaynaklanan renk sabitliği sorunlarına veya nihai üründe kimyasal kalıntı birikimine yol açabilir. Bitmiş tekstil ürününün, özellikle cilt ile doğrudan temas eden bölgelerinin pH değeri genellikle 4,0-7,5 aralığında olması istenir; bu aralık insan cildinin doğal pH'ına (hafif asidik, yaklaşık 5,5) yakındır ve cilt bariyerinin korunmasına yardımcı olur. Bu kriter, Oeko-Tex Standard 100 gibi uluslararası tekstil güvenlik sertifikasyon sistemlerinde düzenli olarak test edilen ve denetlenen parametrelerden biridir. Üretim sürecinde kalan yüksek pH'lı (bazik) kimyasal kalıntılar, özellikle bebek/çocuk giysileri ve hassas ciltli kullanıcılar için tahriş, kaşıntı ve alerjik reaksiyon riskini artırabilir; bu nedenle boyama ve apre sonrası yeterli durulama ve gerektiğinde nötralizasyon (pH dengeleme) işlemi uygulanması önemlidir.",
  },
  {
    id: 'risk-degerlendirme-metotlari',
    baslik: 'Tekstil İşletmelerinde Risk Değerlendirmesi',
    kategori: 'is-guvenligi',
    anahtarKelimeler: [
      'risk değerlendirmesi',
      'iş sağlığı',
      'iş güvenliği',
      'tehlike',
      'kesimhane riski',
      'dikimhane riski',
      'kimyasal maruziyet',
    ],
    icerik:
      'Tekstil işletmelerinde risk değerlendirmesi, iş sağlığı ve güvenliği (İSG) kapsamında üretim sürecinde çalışanları tehdit edebilecek tehlikelerin (makine kazaları, kimyasal maruziyet, yangın, ergonomik riskler, gürültü, toz vb.) sistematik olarak tespit edilip değerlendirildiği ve önlem alındığı bir yönetim sürecidir. Temel adımlar şöyle sıralanabilir: 1) Tehlikelerin tespiti — her bölüm ve işlem için olası tehlike kaynaklarının belirlenmesi; 2) Risklerin analiz edilmesi — her tehlikenin gerçekleşme olasılığı ile gerçekleştiğinde yol açacağı zararın şiddetinin (olasılık × şiddet) değerlendirilmesi; 3) Risklerin derecelendirilmesi — elde edilen skora göre riskin düşük, orta veya yüksek olarak sınıflandırılması; 4) Önleyici tedbirlerin belirlenmesi — riski ortadan kaldıracak veya azaltacak teknik/idari önlemlerin (koruyucu ekipman, eğitim, prosedür değişikliği) planlanması; 5) Uygulama ve takip — alınan önlemlerin hayata geçirilip düzenli aralıklarla etkinliğinin gözden geçirilmesi. Tekstil üretiminde en yüksek risk taşıyan bölümler arasında kesimhane (keskin bıçaklı kesim makineleri, şerit bıçaklar), dikimhane (iğne batması yaralanmaları, tekrarlayan hareketlere bağlı kas-iskelet rahatsızlıkları) ve kimyasal madde kullanılan boyama/apre alanları (solunum yoluyla veya cilt teması ile kimyasal maruziyet) sayılabilir; bu bölümler için risk değerlendirmesi özellikle titizlikle yapılmalı ve düzenli olarak güncellenmelidir.',
  },
  {
    id: 'tekstil-boyama-yontemleri-ozet',
    baslik: 'Tekstil Boyama Yöntemleri Özeti',
    kategori: 'kimya-boyama',
    anahtarKelimeler: [
      'boyama yöntemleri',
      'elyaf boyama',
      'iplik boyama',
      'kumaş boyama',
      'parça boyama',
      'reaktif boya',
      'küp boya',
      'asit boya',
      'ön terbiye',
    ],
    icerik:
      'Tekstil boyamada, boyamanın üretim sürecinin hangi aşamasında yapıldığına göre iki temel yaklaşım vardır. Elyaf/İplik boyama, kumaş henüz dokunmadan veya örülmeden önce, ham elyaf ya da iplik hâlindeyken yapılan boyamadır; bu yöntem genellikle çizgili, ekose veya farklı renkte ipliklerin bir arada kullanıldığı desenli kumaşların üretiminde tercih edilir çünkü her iplik farklı renkte önceden hazırlanabilir. Kumaş (parça) boyama ise kumaş dokunduktan veya örüldükten sonra, tamamlanmış kumaş hâlinde topluca boyanmasıdır; düz (tek renk) kumaşların üretiminde daha ekonomik ve pratik bir yöntemdir çünkü büyük partiler hâlinde işlenebilir. Yöntem ne olursa olsun, genel boyama süreci şu adımlardan oluşur: 1) Ön terbiye/temizleme — kumaş veya elyaf üzerindeki doğal yağların, apre kalıntılarının ve kirin giderilmesi; 2) Boyama — elyaf tipine uygun boyar madde sınıfı ile renklendirme; 3) Durulama — fazla/bağlanmamış boyanın yıkanarak uzaklaştırılması; 4) Sabitleme/fiksaj — boyanın life kalıcı olarak bağlanmasını sağlayan işlem; 5) Kurutma. Elyaf tipi, kullanılacak boyar madde sınıfını belirler: pamuk ve diğer selülozik elyaflar için reaktif veya küp boyalar, polyester gibi sentetik elyaflar için dispers boyalar, yün ve naylon gibi protein bazlı veya poliamid elyaflar için asit boyalar tercih edilir; yanlış boyar madde-elyaf eşleşmesi zayıf haslık ve düşük renk verimine yol açar.',
  },
  {
    id: 'sonil-kumas-ozellikleri',
    baslik: 'Şönil Kumaş Özellikleri',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'şönil',
      'şönil kumaş',
      'özellikleri',
      'döşemelik',
      'battaniye',
      'kadife',
    ],
    icerik:
      'Şönil (chenille) kumaş, yüzeyinde kadife benzeri yumuşak ve tüylü bir doku bulunan, özel bükümlü şönil ipliğinden üretilen bir kumaş türüdür. Şönil ipliği, kısa lif parçacıklarının iki ana iplik arasına sıkıştırılıp bükülmesiyle elde edilir; bu yapı iplik yüzeyinde her yöne çıkıntı yapan tüycükler oluşturur ve dokunulduğunda kadifemsi, yumuşak bir his verir. Kumaşın dolgun ve zengin görünümü nedeniyle döşemelik kumaş (koltuk, perde), battaniye, atkı-şal ve kazak gibi ürünlerde tercih edilir. Şönil kumaşın aşınma direnci; kullanılan iplik yapısına, şönil ipliğinin sıkılığına ve uygulanan üretim/bitim yöntemine (baskı, kabartma gibi ilave işlemler) bağlı olarak değişkenlik gösterir; bazı şönil kumaşlar yüzey sürtünmesine karşı orta-düşük düzeyde dayanım sergileyebilir, tüyler zamanla düzleşebilir veya dökülebilir. Bu nedenle özellikle yoğun kullanılan döşemelik uygulamalarda şönil kumaşın Martindale (aşınma) testi gibi kalite testlerinden geçirilerek dayanıklılığının doğrulanması önerilir.',
  },
  {
    id: 'iplik-kalite-kontrolu',
    baslik: 'İplik Kalite Kontrolünde Önemli Parametreler',
    kategori: 'kumas-bilgisi',
    anahtarKelimeler: [
      'iplik kalite kontrolü',
      'düzensizlik yüzdesi',
      'u yüzdesi',
      'düğüm sayısı',
      'iplik temizleme',
    ],
    icerik:
      'İplik kalite kontrolünde izlenen başlıca parametreler, ipliğin dokuma veya örme sırasındaki performansını ve nihai kumaş kalitesini doğrudan etkiler. Düzensizlik yüzdesi (U%), ipliğin boyu boyunca kalınlığındaki değişkenliği ölçen bir parametredir; düşük U% değeri, ipliğin daha düzgün ve tutarlı bir kalınlığa sahip olduğu, dolayısıyla daha kaliteli olduğu anlamına gelir, yüksek U% ise kumaş yüzeyinde görünür ton/doku farklılıklarına yol açabilir. Düğüm sayısı (ince/kalın yer sayısı), iplik üzerinde beklenmedik kalınlaşma veya inceleşme noktalarının birim uzunluk başına sıklığını ifade eder; bu düzensizlikler dokuma veya örme sırasında iplik kopmasına, makine duruşlarına ve kumaş yüzeyinde görünür hatalara neden olabilir. Bu parametreler büyük ölçüde iplik üretim hattındaki temizleme ve tarak makinelerinin (iplik temizleyicileri, karde/tarak üniteleri) doğru ayarlanması ve düzenli bakımı ile kontrol altında tutulur; bakımı ihmal edilen makineler ipliğe yabancı madde, kısa lif artığı veya düzensiz gerginlik aktararak kalite düşüşüne yol açar. Kaliteli iplik kullanımı, üretim hattında daha az dikiş/dokuma hatası, daha az makine duruşu ve sonuç olarak daha yüksek genel üretim verimliliği sağlar.',
  },
  {
    id: 'elyaf-boyama-oncesi-hazirlik',
    baslik: 'Boyama Öncesi Elyaf/Kumaş Hazırlığı (Ön Terbiye)',
    kategori: 'kimya-boyama',
    anahtarKelimeler: [
      'ön terbiye',
      'haşıl sökme',
      'ağartma',
      'merserizasyon',
      'boyama öncesi hazırlık',
      'ton farkı',
    ],
    icerik:
      'Boyama öncesi elyaf/kumaş hazırlığı, tekstil sektöründe ön terbiye olarak adlandırılan ve ham kumaş üzerindeki doğal yağları, üretim sırasında eklenen apre/koruyucu maddeleri, kir ve diğer safsızlıkları gidermeyi amaçlayan işlemler bütünüdür. Temel ön terbiye adımları şunlardır: Haşıl sökme, dokuma kumaşlarda dokuma sırasında çözgü ipliğinin kopmasını önlemek için uygulanan nişasta bazlı koruyucu haşıl maddesinin, dokuma tamamlandıktan sonra enzim veya kimyasal yöntemlerle temizlenmesidir. Yıkama/ağartma, elyaf üzerindeki doğal renk pigmentlerinin (özellikle pamukta bulunan sarımsı doğal tonun) giderilmesi işlemidir; bu adım özellikle beyaz veya açık ton boyamalarda, istenen rengin net ve doğru elde edilebilmesi için kritik önem taşır. Merserizasyon, pamuklu kumaşa yoğun kostik soda çözeltisi uygulanarak yapılan bir işlemdir; lifin şeklini değiştirerek kumaşa kalıcı bir parlaklık, artan mukavemet ve daha yüksek boya alma kapasitesi kazandırır. Ön terbiye aşamasının eksik, hatalı veya tutarsız (partiler arası farklı) yapılması, sonraki boyama aşamasında lekelenme, düzensiz renk dağılımı (ton farkı) veya boyanın kalıcılığını gösteren haslık değerlerinde düşüklük gibi ciddi kalite sorunlarına yol açar; bu nedenle ön terbiye, boyama sürecinin görünmez ama belirleyici bir temel adımı olarak kabul edilir.',
  },
  {
    id: 'hazir-giyim-uretim-plani-genel',
    baslik: 'Hazır Giyim Üretim Planlama Süreci - Genel Akış',
    kategori: 'uretim-planlama',
    anahtarKelimeler: [
      'üretim planlama',
      'üretim planı',
      'planlama süreci',
      'planlama akışı',
      'buyer siparişi',
      'müşteri siparişi',
      'sipariş akışı',
      'hammadde takibi',
      'zincirleme etki',
      'onay aşamaları',
      'termin',
    ],
    icerik:
      'Hazır giyim üretim planlama süreci, buyer/müşteri siparişinin alınmasından sevkiyata kadar birbirine bağımlı aşamalardan oluşan bir zincirdir. Genel akış şu şekildedir: 1) Buyer/Müşteri siparişi verilir; 2) Planlama birimi siparişi alır ve sisteme kaydeder; 3) Kumaş ve yardımcı malzeme (aksesuar) siparişi verilir; 4) Hammadde geliş takibi yapılır (kumaş/aksesuarın planlanan tarihte gelip gelmediği izlenir); 5) PP (Pre-Production) numune dikimi yapılır ve buyer onayına sunulur; 6) PP numune onaylandıktan sonra modelhaneden pastal talep edilir; 7) Pastalın kumaş sarfiyatı hesaplanır ve planlama tarafından onaylanır; 8) Sarfiyat onayı sonrası kesim onayı verilir; 9) Kesim yapılır; 10) Gerekiyorsa ara operasyonlar (yıkama, nakış, baskı) uygulanır; 11) Dikim yapılır; 12) Ütü/pres işlemi yapılır; 13) Paketleme yapılır; 14) Sevkiyat gerçekleştirilir. Bu akıştaki en kritik özellik, her aşamanın bir öncekinin tamamlanmasına bağlı olmasıdır: herhangi bir aşamada oluşan gecikme, kendisinden sonraki tüm aşamaları da geciktirir (zincirleme etki). Bu nedenle planlamacının her aşamayı ayrı ayrı değil, birbirine bağlı bir bütün olarak takip etmesi gerekir.',
  },
  {
    id: 'pp-numune-nedir',
    baslik: 'PP (Pre-Production) Numune Nedir?',
    kategori: 'uretim-planlama',
    anahtarKelimeler: [
      'pp numune',
      'pp',
      'numune',
      'pre-production',
      'üretim öncesi numune',
      'seri üretim onayı',
      'buyer onayı',
      'prototip',
      'kilit nokta',
      'gate',
      'kalıp dikiş ölçü uyumu',
      'nedir',
    ],
    icerik:
      'PP (Pre-Production / Üretim Öncesi) Numune, seri üretime geçmeden önce, gerçek üretimde kullanılacak asıl kumaş ve aksesuarlarla dikilen örnek/prototip üründür. PP numunenin amacı, seri üretime başlamadan önce kalıp, dikiş, ölçü ve malzeme uyumunun buyer (müşteri) tarafından incelenip onaylanmasını sağlamaktır. PP numune onaylanmadan seri üretime geçilmesi büyük risk taşır: onaylanmamış bir numuneden sonra üretime devam edilir ve daha sonra hata tespit edilirse, üretilmiş olan tüm sipariş revize veya red riskiyle karşı karşıya kalabilir; bu da ciddi zaman ve maliyet kaybına yol açar. Bu yüzden PP numune onayı, hazır giyim üretim planlama sürecinin en kritik kilit noktalarından (gate) biridir — sonraki tüm aşamalar (pastal talebi, sarfiyat onayı, kesim onayı, kesim, dikim) ancak PP numune onaylandıktan sonra başlatılmalıdır.',
  },
  {
    id: 'pastal-talebi-ve-sarfiyat-onayi',
    baslik: 'Pastal Talebi ve Sarfiyat Onay Süreci',
    kategori: 'uretim-planlama',
    anahtarKelimeler: [
      'pastal talebi',
      'sarfiyat onayı',
      'sarfiyat',
      'modelhane',
      'kumaş sarfiyatı',
      'beden dağılımı',
      'pastal planı',
      'kumaş yeterliliği',
      'maliyet etkisi',
      'kesime geçiş',
    ],
    icerik:
      'PP numune onaylandıktan sonra, planlama modelhaneden (kalıp/model bölümünden) o sipariş için pastal (kesim şablonu/marker) talep eder. Modelhane, sipariş edilen beden dağılımına uygun pastal planını hazırlar ve bu pastalın ne kadar kumaş harcayacağını, yani sarfiyatını hesaplar. Bu sarfiyat rakamı planlama tarafından mutlaka onaylanmalıdır; çünkü sarfiyat rakamı hem sipariş için ayrılan kumaşın yeterli olup olmadığını hem de siparişin maliyetini doğrudan etkiler — sarfiyat beklenenden yüksek çıkarsa kumaş yetersiz kalabilir veya maliyet öngörülenin üzerine çıkabilir. Bu nedenle sarfiyat onaylanmadan kesime geçilmez; sarfiyat onayı, pastal talebi ile kesim onayı arasındaki zorunlu ara kontrol noktasıdır.',
  },
  {
    id: 'kesim-onayi-surec',
    baslik: 'Kesim Onayı Süreci',
    kategori: 'uretim-planlama',
    anahtarKelimeler: [
      'kesim onayı',
      'kesim onayı ne zaman',
      'kesimhane',
      'top kontrolü',
      'ton kontrolü',
      'geri dönüşü olmayan',
      'geri dönüşü zor',
      'kumaş kesimi',
      'onay eşiği',
    ],
    icerik:
      'Sarfiyat onaylandıktan sonra planlama, kesimhaneye resmi "kesim onayı" verir. Bu onay, kesimhanenin artık o siparişin kumaşını kesmeye başlayabileceği anlamına gelir. Kesim onayı verilmeden önce kumaşın depoda hazır ve kontrolden geçmiş olması gerekir: top kontrolü (her kumaş topunun eksiksiz ve hasarsız olduğunun kontrolü) ve ton kontrolü (farklı kumaş partileri/topları arasında renk tonu farkı olup olmadığının kontrolü) bu aşamada tamamlanmış olmalıdır. Kesim onayı, tüm üretim sürecinde geri dönüşü zor bir eşiktir: kumaş kesildikten sonra bir hata fark edilirse iade veya değişim mümkün olmaz, kesilen kumaş genellikle kullanılamaz hâle gelir. Bu yüzden kesim onayına kadarki tüm önceki onayların (PP numune onayı, pastal talebi, sarfiyat onayı) doğru ve eksiksiz yapılmış olması kritik önem taşır — kesim onayı, bu zincirin son ve en riskli kontrol noktasıdır.',
  },
  {
    id: 'ara-operasyonlar-yikama-nakis-baski',
    baslik: 'Ara Operasyonlar: Yıkama, Nakış, Baskı',
    kategori: 'uretim-planlama',
    anahtarKelimeler: [
      'ara operasyon',
      'ara operasyonlar',
      'yıkama',
      'nakış',
      'baskı',
      'dikim öncesi',
      'dikim sonrası',
      'ek tedarikçi',
      'atölye koordinasyonu',
      'termin süresi',
    ],
    icerik:
      'Bazı ürünlerde standart kesim → dikim → ütü → paket akışına ek olarak ara operasyonlar gerekebilir. Yıkama, genellikle denim ve gramajlı pamuklu ürünlerde yumuşatma, eskitme veya çekme kontrolü amacıyla uygulanır ve genellikle dikim sonrası yapılır. Nakış, dikim öncesinde (kesilmiş parça üzerine) veya dikim sonrasında (bitmiş ürün üzerine) logo veya desen işlemek için uygulanabilir. Baskı ise dikim öncesinde kumaşa veya kesilmiş parçalara, bazen de dikim sonrasında bitmiş ürün üzerine uygulanabilir. Bu ara operasyonların ortak özelliği, planlamaya ekstra süre ve ek tedarikçi/atölye koordinasyonu olarak yansımalarıdır: her ara operasyon, ürünün genellikle dış bir atölyeye veya tedarikçiye gönderilip geri alınmasını gerektirdiğinden toplam üretim süresine ek gün ekler. Bu nedenle termin (EXF) hesaplanırken, siparişte ara operasyon varsa bu ek süre mutlaka plana dahil edilmeli, aksi hâlde termin riski gerçekçi hesaplanamaz.',
  },
  {
    id: 'uretim-plani-zincirleme-gecikme-etkisi',
    baslik: 'Üretim Planlamasında Zincirleme Gecikme Etkisi',
    kategori: 'uretim-planlama',
    anahtarKelimeler: [
      'zincirleme gecikme',
      'zincirleme etki',
      'gecikme etkisi',
      'erken uyarı',
      'termin riski',
      'malzeme takibi',
      'telafi edici aksiyon',
      'ek vardiya',
      'alternatif tedarikçi',
      'kısmi sevkiyat',
    ],
    icerik:
      'Hazır giyim üretiminde her aşama bir öncekine bağımlı olduğu için, herhangi bir aşamada oluşan gecikme otomatik olarak kendisinden sonraki tüm aşamaları da geciktirir. Örnek bir zincirleme gecikme senaryosu şöyledir: kumaş 4 gün geç geldi → PP numune 4 gün geç başladı → pastal talebi ve sarfiyat onayı 4 gün kaydı → kesim onayı ve kesim 4 gün geç başladı → dikim hattının kapasitesi kaydı (hat başka siparişlerle dolmuş olabilir) → EXF (sevkiyat) tarihi riske girdi. Bu zincirleme etki nedeniyle üretim planlamasında erken uyarı sistemleri büyük önem taşır: malzeme takibi (kumaş/aksesuarın beklenen tarihte gelip gelmediğinin izlenmesi) ve termin riski hesaplama (EXF tarihine göre gecikme riskinin erkenden tespit edilmesi) gibi mekanizmalar, sorunu daha ilk aşamada yakalamayı sağlar. Sorunu erken tespit etmek, telafi edici aksiyonlar için zaman kazandırır: ek vardiya planlamak, alternatif bir tedarikçiden hızlı temin sağlamak veya siparişi kısmi sevkiyatlarla bölerek en azından bir kısmını zamanında göndermek gibi önlemler, ancak gecikme erken fark edilirse uygulanabilir hâle gelir.',
  },
  {
    id: 'planlamaci-gorev-ve-sorumluluklari',
    baslik: 'Üretim Planlamacısının Görev ve Sorumlulukları',
    kategori: 'uretim-planlama',
    anahtarKelimeler: [
      'planlamacı',
      'planlamacının görevleri',
      'planlamacı sorumlulukları',
      'kapasite planlama',
      'hat kapasitesi',
      'merchandiser',
      'üretim takibi',
      'kalite izleme',
      'fire takibi',
    ],
    icerik:
      "Üretim planlamacısının temel görev ve sorumlulukları şunlardır: Siparişleri buyer/merchandiser'dan almak ve sisteme eksiksiz kaydetmek; kumaş ve aksesuar siparişlerini zamanında vermek ve tedarikçi teslimatlarını takip etmek; PP numune, pastal talebi, sarfiyat onayı ve kesim onayı süreçlerini sırasıyla yönetip her aşamanın zamanında tamamlanmasını sağlamak; hat/atölye kapasitesini mevcut ve gelecek siparişlere göre dağıtmak (kapasite planlama), böylece hiçbir hattın boş kalmaması veya aşırı yüklenmemesi sağlanır; termin risklerini erken tespit edip gerekli aksiyonları (ek vardiya, alternatif tedarikçi, kısmi sevkiyat gibi) zamanında almak; üretim ilerlemesini kesim, dikim, ütü, paket ve sevkiyat aşamalarında günlük olarak takip etmek; kalite sorunlarını (fire oranı, 2. kalite oranı) izlemek ve oranlar kabul edilebilir sınırların üzerine çıktığında üretim sürecine müdahale etmek. Planlamacı, özetle, siparişin alınmasından sevkiyatına kadar tüm zincirin koordinatörü konumundadır ve zincirdeki herhangi bir aşamada oluşabilecek aksamayı en erken şekilde fark edip yönetmekle sorumludur.",
  },
  {
    id: 'yalin-uretim-nedir',
    baslik: 'Yalın Üretim (Lean Manufacturing) Nedir?',
    kategori: 'yalin-uretim',
    anahtarKelimeler: [
      'yalın üretim',
      'lean manufacturing',
      'lean',
      'toyota üretim sistemi',
      'tps',
      'israf',
      'muda',
      'değer akışı',
      'çekme sistemi',
      'pull sistemi',
      'sürekli iyileştirme',
      'nedir',
    ],
    icerik:
      'Yalın üretim (Lean Manufacturing), Toyota Üretim Sistemi\'nden (TPS) doğan, müşteriye değer katmayan her türlü israfı (Japonca "muda") ortadan kaldırarak daha az kaynakla daha fazla değer üretmeyi hedefleyen bir yönetim felsefesidir. Temel prensip şudur: "değer, müşterinin ödemeye razı olduğu şeydir; bunun dışındaki her faaliyet israftır." Yalın üretimin beş temel prensibi şöyledir: (1) Değeri tanımla — müşteri gözünden neyin değerli olduğunu belirle; (2) Değer akışını haritalandır — ürünün hammaddeden müşteriye kadar geçtiği tüm adımları çıkar; (3) Akışı sağla — üretimin duraksamadan, bekletmeden ilerlemesini sağla; (4) Çekme sistemi kur — üretimi tahminle değil gerçek talep sinyaliyle başlat (push yerine pull); (5) Mükemmelliği hedefle — sürekli iyileştirmeyi (kaizen) kurumsallaştır. Tekstil/konfeksiyon üretiminde yalın uygulaması, hat dengeleme, stok azaltma, kalite hatalarını kaynağında önleme gibi alanlarda somutlaşır.',
  },
  {
    id: 'yedi-israf-turu-detayli',
    baslik: '7 Temel İsraf Türü (Muda) — Tekstil Örnekleriyle',
    kategori: 'yalin-uretim',
    anahtarKelimeler: [
      'israf türleri',
      'muda',
      'yedi israf',
      '7 israf',
      'fazla üretim',
      'overproduction',
      'bekleme israfı',
      'gereksiz taşıma',
      'transportation',
      'gereksiz işlem',
      'over-processing',
      'stok fazlası',
      'inventory',
      'gereksiz hareket',
      'motion',
      'hatalı üretim',
      'defects',
      'fire',
      'kullanılmayan yetenek',
    ],
    icerik:
      'Yalın üretimde 7 temel israf türü (muda), tekstil/konfeksiyon örnekleriyle şöyle açıklanabilir: (1) FAZLA ÜRETİM (Overproduction) — ihtiyaçtan veya siparişten fazla miktarda kesim/dikim yapmaktır. Tekstil örneği: bir sonraki operasyon henüz hazır olmadan önceki operasyonun aşırı miktarda parça üretmesi, gereksiz ara stok (WIP) birikmesine yol açar; en kötü israf türü kabul edilir çünkü diğer tüm israfları tetikler. (2) BEKLEME (Waiting) — operatörün, makinenin veya malzemenin bir sonraki işlem için boşta beklemesidir. Tekstil örneği: dikim hattında bir operatörün önceki operasyondan parça beklemesi, kumaşın onay/kesim emri beklemesi, makine arızası nedeniyle üretimin durması. (3) GEREKSİZ TAŞIMA (Transportation) — malzemenin/yarı mamulün gereksiz yere bir yerden bir yere taşınmasıdır. Tekstil örneği: kesilen parçaların dikim hattına uzak bir depoda tutulup sürekli taşınması, kötü yerleşim planı nedeniyle parçaların hat içinde ileri-geri gitmesi. (4) GEREKSİZ İŞLEM (Over-processing) — müşterinin talep etmediği veya değer katmayan fazladan işlem yapmaktır. Tekstil örneği: gerekli olmayan ekstra kalite kontrol adımları, müşterinin istemediği fazladan süsleme/işçilik. (5) STOK FAZLASI (Inventory) — ihtiyaçtan fazla hammadde, yarı mamul veya bitmiş ürün stoku tutmaktır. Tekstil örneği: gereğinden fazla kumaş/aksesuar stoklamak (sermaye bağlar, bozulma/moda riski taşır), aşırı ara stok (kesilmiş ama dikilmemiş parça yığınları). (6) GEREKSİZ HAREKET (Motion) — operatörün işini yaparken gereksiz el, göz veya vücut hareketi yapmasıdır. Tekstil örneği: kötü iş istasyonu düzeni nedeniyle operatörün makas/iplik/parça için sürekli uzanması, ergonomik olmayan çalışma pozisyonu. (7) HATALI ÜRETİM/FİRE (Defects) — yeniden işlem (rework) veya ıskarta gerektiren hatalı ürün üretmektir. Tekstil örneği: dikiş hatası, ölçü sapması, leke, ton farkı; bunlar hem malzeme hem işçilik kaybına yol açar, üretim planlamasını da geciktirir. Bazı yalın uzmanları buna 8. israf türü olarak "kullanılmayan yetenek/potansiyel"i (operatörlerin fikir ve becerilerinin değerlendirilmemesi) ekler.',
  },
  {
    id: '5s-nedir-detayli',
    baslik: '5S Nedir? (Detaylı — Tekstil Atölyesi Örnekleriyle)',
    kategori: 'yalin-uretim',
    anahtarKelimeler: [
      '5s',
      'seiri',
      'seiton',
      'seiso',
      'seiketsu',
      'shitsuke',
      'sırala',
      'düzenle',
      'temizle',
      'standartlaştır',
      'sürdür',
      'işyeri düzeni',
      'görsel yönetim',
    ],
    icerik:
      '5S, işyeri düzeni ve standardizasyonu için kullanılan, Japonca beş kelimeyle tanımlanan sistematik bir yöntemdir. Tekstil atölyesi örnekleriyle beş adım şöyledir: SEIRI (Sırala/Ayıkla) — gerekli olan ile olmayanı ayırt et, gereksiz olanı ortamdan kaldır. Tekstil örneği: kesim masasında kullanılmayan eski şablonları, bozuk makasları, işi bitmiş kesim kalıplarını ortamdan çıkarmak. SEITON (Düzenle/Yerleştir) — gerekli olan her şeye sabit, mantıklı bir yer belirle ("her şeyin bir yeri var, her şey yerinde"). Tekstil örneği: dikim hattında iplik makaralarının, makasların, yardımcı aksesuarların operatörün elinin en kolay ulaşacağı, işaretlenmiş sabit yerlerde tutulması; renk kodlu raflarla malzeme karışıklığının önlenmesi. SEISO (Temizle) — çalışma alanını düzenli olarak temizle, temizlik sırasında ekipman/makine kontrolü de yap (temizlik = kontrol). Tekstil örneği: dikiş makinelerinin gün sonunda temizlenmesi, iplik artıklarının/tozun toplanması; bu aynı zamanda erken arıza tespitini sağlar. SEIKETSU (Standartlaştır) — ilk üç adımı (sırala, düzenle, temizle) sürekli uygulanan bir standart hâline getir, görsel kontrol sistemleri kur. Tekstil örneği: her iş istasyonu için standart yerleşim fotoğrafı/şeması asmak, renk kodlu zemin işaretleri ile malzeme/ekipman alanlarını belirlemek. SHITSUKE (Sürdür/Disiplin) — standartların sürekli uygulanmasını alışkanlık hâline getirmek, düzenli denetim yapmak. Tekstil örneği: haftalık 5S denetim checklist\'i, atölye şefinin düzenli kontrolü, iyi uygulamaların ödüllendirilmesi. 5S\'in faydaları: iş kazalarının azalması, malzeme arama süresinin kısalması, verimliliğin artması, kalite hatalarının azalması, çalışan moralinin yükselmesi.',
  },
  {
    id: 'kaizen-nedir-detayli',
    baslik: 'Kaizen Nedir? (Detaylı)',
    kategori: 'yalin-uretim',
    anahtarKelimeler: [
      'kaizen',
      'sürekli iyileştirme',
      'puko',
      'pdca',
      'planla uygula kontrol et önlem al',
      'kaizen blitz',
      'kaizen event',
      'küçük adımlar',
      'nedir',
    ],
    icerik:
      'Kaizen, Japonca "kai" (değişim) ve "zen" (iyi) kelimelerinden oluşan, "sürekli iyileştirme" anlamına gelen bir felsefedir. Büyük, radikal değişiklikler yerine, küçük ama sürekli ve herkesin katılımıyla yapılan iyileştirmeleri esas alır. Temel ilkeleri şöyledir: (1) Her süreç iyileştirilebilir — "mükemmel" bir süreç yoktur, her zaman daha iyisi bulunabilir. (2) Herkesin katılımı — kaizen sadece yöneticilerin değil, hattaki her operatörün fikir üretebileceği bir kültürdür; en iyi iyileştirme fikirleri genelde işi bizzat yapan kişiden gelir. (3) Küçük adımlar — büyük yatırım gerektirmeyen, hızlı uygulanabilen değişiklikler tercih edilir. (4) PUKÖ döngüsü (Planla-Uygula-Kontrol Et-Önlem Al / PDCA) — her iyileştirme bu döngüyle test edilir: Planla (sorunu tanımla, çözüm öner), Uygula (küçük ölçekte dene), Kontrol Et (sonucu ölç), Önlem Al (işe yaradıysa standartlaştır, yaramadıysa yeni döngüye başla). Tekstil üretiminde kaizen örnekleri: bir operatörün önerdiği basit bir aparat değişikliğiyle dikiş süresinin kısalması, kesim masası yerleşiminin değiştirilerek taşıma mesafesinin azaltılması, kalite kontrol noktasının hat içine taşınarak hatanın daha erken (daha az maliyetle) yakalanması. Kaizen etkinlikleri (Kaizen Blitz/Event), belirli bir soruna odaklanan, genelde 3-5 gün süren, çapraz fonksiyonlu bir ekiple yürütülen yoğun iyileştirme çalışmalarıdır; örneğin "dikim hattı X\'in verimliliğini artırma" hedefiyle bir haftalık yoğun kaizen çalışması yapılabilir. Kaizen kültürünün faydaları: çalışan bağlılığının artması (fikirleri değer görüyor), sürekli maliyet düşüşü, kalite artışı, sorunların kaynağında (gemba — "gerçek yer", yani üretim sahasının kendisi) çözülmesi.',
  },
  {
    id: 'gemba-nedir',
    baslik: 'Gemba Nedir?',
    kategori: 'yalin-uretim',
    anahtarKelimeler: [
      'gemba',
      'gemba walk',
      'gemba yürüyüşü',
      'gerçek yer',
      'sahada gözlem',
      'nedir',
    ],
    icerik:
      'Gemba, Japonca "gerçek yer" anlamına gelir; yalın üretimde işin gerçekten yapıldığı yeri (fabrika zemini, dikim hattı, kesimhane) ifade eder. "Gemba Walk" (Gemba Yürüyüşü), yöneticilerin ofisten çıkıp düzenli olarak üretim sahasına gidip, süreci yerinde gözlemleyip operatörlerle konuşarak sorunları birinci elden tespit etmesi pratiğidir. Temel prensip şudur: "sorunun gerçek çözümü, sorunun gerçekleştiği yerde bulunur" — masabaşında rapor okuyarak değil, sahaya giderek doğru kararlar alınabilir.',
  },
  {
    id: 'kanban-ve-cekme-sistemi',
    baslik: 'Kanban ve Çekme (Pull) Sistemi',
    kategori: 'yalin-uretim',
    anahtarKelimeler: [
      'kanban',
      'çekme sistemi',
      'pull sistemi',
      'itme sistemi',
      'push sistemi',
      'görsel sinyal',
      'wip',
      'ara stok',
    ],
    icerik:
      'Kanban, Japonca "görsel sinyal/kart" anlamına gelir; bir üretim aşamasının bir sonraki aşamaya "bana şu kadar malzeme/parça gönder" sinyali vermesini sağlayan görsel bir yönetim aracıdır. Geleneksel "itme" (push) sisteminde üretim tahminle önceden yapılıp depolanır; "çekme" (pull) sisteminde ise üretim, gerçek talep sinyaline göre (bir sonraki aşama ihtiyaç duyduğunda) başlatılır. Tekstil örneği: dikim hattında her istasyon, bir önceki istasyondan sadece işleyebileceği kadar parça çeker, bu da aşırı ara stok birikimini (WIP) önler. Kanban kartları/kutuları, hangi malzemeden ne kadar gerektiğini görsel olarak gösterir; bu da stok yönetimini basitleştirir ve fazla üretim israfını azaltır.',
  },
  {
    id: 'yalin-uretim-tekstilde-uygulama-alanlari',
    baslik: 'Yalın Üretimin Tekstilde Uygulama Alanları',
    kategori: 'yalin-uretim',
    anahtarKelimeler: [
      'yalın uygulama',
      'smed',
      'hızlı model değişimi',
      'poka-yoke',
      'hata önleme',
      'görsel yönetim',
      'değer akış haritalama',
      'value stream mapping',
      'vsm',
    ],
    icerik:
      'Yalın üretimin tekstil/konfeksiyon işletmesinde somut uygulama alanları şunlardır: Hat dengeleme (line balancing) — darboğaz operasyonları tespit edip iş yükünü eşitleyerek bekleme israfını azaltmak. Hızlı model değişimi (SMED — Single Minute Exchange of Die) — bir üründen diğerine geçiş/hat kurulum süresini kısaltmak, böylece daha küçük partilerle daha sık model değişimi ekonomik hâle gelir. Poka-yoke (hata önleme) — hatanın oluşmasını fiziksel/mekanik olarak imkânsız kılan basit düzenekler (örn. parçanın sadece doğru yönde takılabileceği şablonlar), kaliteyi kaynağında garanti eder. Görsel yönetim (visual management) — üretim durumunun, hedeflerin, sorunların pano/gösterge ile herkesin görebileceği şekilde sunulması (örn. hat başına günlük hedef/gerçekleşen tahtası). Değer akış haritalama (Value Stream Mapping) — siparişten sevkiyata kadar tüm sürecin adım adım çizilip, değer katmayan adımların (bekleme, gereksiz taşıma) görsel olarak tespit edilmesi.',
  },
  {
    id: 'renk-teorisi-tekstilde',
    baslik: 'Tekstilde Renk Teorisi Temelleri',
    kategori: 'tasarim-kulturu',
    anahtarKelimeler: [
      'renk teorisi',
      'ana renkler',
      'renk sıcaklığı',
      'sıcak renkler',
      'soğuk renkler',
      'renk tonu',
      'hue',
      'doygunluk',
      'saturation',
      'parlaklık',
      'value',
      'pantone',
      'ral',
      'renk kodlama',
    ],
    icerik:
      "Tekstilde renk teorisinin temelleri şöyledir: Ana renkler (kırmızı, mavi, sarı) birbirine karıştırılarak ara renkler elde edilir. Renk sıcaklığı kavramında sıcak renkler (kırmızı, turuncu, sarı) canlı/enerjik izlenim verir, soğuk renkler (mavi, yeşil, mor) ise sakin/ferah izlenim verir. Renk tonu (hue), doygunluk (saturation) ve parlaklık (value/lightness) bir rengi tanımlayan üç temel boyuttur. Tekstilde renk seçimi, hedef müşteri kitlesi, sezon (SS/AW koleksiyonları) ve trend tahminlerine göre yapılır. Pantone gibi standart renk kodlama sistemleri, farklı üretim tesisleri ve ülkeler arasında renk tutarlılığını garanti etmek için kullanılır — bir buyer'ın istediği rengin, farklı boyahanelerde birebir aynı çıkması için Pantone/RAL gibi kodlarla iletişim kurulur.",
  },
  {
    id: 'ton-farki-nedir',
    baslik: 'Ton Farkı Nedir?',
    kategori: 'tasarim-kulturu',
    anahtarKelimeler: [
      'ton farkı',
      'shade variation',
      'lot farkı',
      'parti farkı',
      'boyama farkı',
      'renk sapması',
      'top kontrolü',
      'nedir',
    ],
    icerik:
      'Ton farkı (shade variation), aynı renk reçetesiyle boyanmış farklı partilerin (lot/batch) arasında oluşan küçük renk sapmalarıdır. Nedenleri şunlardır: farklı boyama makinelerinde farklı sıcaklık/süre koşulları, kumaş partisi farklılıkları, su kalitesi değişimleri, boyar madde parti farklılıkları. Ton farkı, hazır giyim üretiminde ciddi bir kalite sorunu olabilir — özellikle aynı üründe farklı parçaların (örn. ön beden ile kol) farklı kumaş partilerinden kesilmesi durumunda görsel uyumsuzluk yaratır. Bu yüzden kesim öncesi top kontrolünde ton farkı kontrolü kritik bir adımdır; aynı ürün için mümkün olduğunca aynı lot/parti kumaş kullanılması önerilir.',
  },
  {
    id: 'kumas-yuzey-dokusu',
    baslik: 'Kumaş Yüzey Dokusu (Texture)',
    kategori: 'tasarim-kulturu',
    anahtarKelimeler: [
      'yüzey dokusu',
      'texture',
      'doku',
      'el hissi',
      'tuşe',
      'bitim işlemi',
      'kadife',
      'krep',
      'ribli',
    ],
    icerik:
      'Kumaş yüzey dokusu (texture), kumaşın el ile hissedilen ve göz ile görülen yüzey karakteridir. Doku, iplik tipi (kalın/ince, düzgün/tüylü), örgü/dokuma yapısı (düz, ribli, krep, kadife) ve bitim işlemlerinden (zımpara, kaplama, baskı) etkilenir. Doku, bir ürünün algılanan kalitesini ve konforunu doğrudan etkiler — pürüzsüz dokular genelde daha "lüks" algılanırken, doğal/kaba dokular "rustik" veya "casual" bir görünüm verir. Tasarımda doku seçimi, ürünün kullanım amacına (günlük giyim, spor, abiye) uygun olmalıdır.',
  },
  {
    id: 'tekstilde-mekan-ve-sergileme',
    baslik: 'Tekstil Ürünlerinde Mekân ve Sergileme İlişkisi',
    kategori: 'tasarim-kulturu',
    anahtarKelimeler: [
      'sergileme',
      'mağaza tasarımı',
      'visual merchandising',
      'vm',
      'görsel merchandising',
      'aydınlatma',
      'ürün gruplama',
      'algılanan kalite',
    ],
    icerik:
      'Tekstil ürünlerinin mekân ile ilişkisi (mağaza/sergileme tasarımı) şu şekilde özetlenebilir: bir tekstil ürününün algılanan değeri, sadece kendi kalitesiyle değil, sergilendiği ortamla da şekillenir. Mağaza içi görsel merchandising (VM — visual merchandising), aydınlatma, renk kontrastı ve ürün gruplama stratejileri, müşterinin ürüne olan ilgisini ve algılanan kaliteyi etkiler. Bu kavram, hazır giyim üreticileri için doğrudan üretim süreci değil ama nihai ürünün pazardaki konumlanmasını etkileyen önemli bir faktördür — üretim planlamasında bu bilgi, hangi ürünlerin öne çıkarılacağı ve hangi miktarlarda üretileceği kararlarını etkileyebilir.',
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

const EXACT_MATCH_SCORE = 1;
const STEM_MATCH_SCORE = 0.5;
// Türkçe çekim ekleri (nasıl→nasıldı, hesaplama→hesaplanır vb.) genellikle
// kelimenin ilk birkaç harfini değiştirmez; bu eşik altındaki kelimeler için
// kök eşleştirmesi devre dışı bırakılır (kısa kelimelerde yanlış pozitif riski yüksek).
const MIN_STEM_LENGTH = 5;

// İki kelime, ikisi de MIN_STEM_LENGTH'ten uzunsa ve ilk MIN_STEM_LENGTH
// karakterleri aynıysa aynı köke sahip kabul edilir (ör. "hesaplanır" ~ "hesaplama").
function sharesStem(a: string, b: string): boolean {
  if (a.length < MIN_STEM_LENGTH || b.length < MIN_STEM_LENGTH) return false;
  return a.slice(0, MIN_STEM_LENGTH) === b.slice(0, MIN_STEM_LENGTH);
}

function buildCardCorpus(card: KnowledgeCard): Set<string> {
  return new Set([
    ...card.anahtarKelimeler.flatMap((keyword) => tokenize(keyword)),
    ...tokenize(card.baslik),
  ]);
}

// Kütüphane sabit olduğu için her kartın kelime havuzu tek seferde hesaplanır.
const CARD_CORPORA: Map<KnowledgeCard, Set<string>> = new Map(
  TEXTILE_KNOWLEDGE_LIBRARY.map((card) => [card, buildCardCorpus(card)]),
);

// Doküman frekansı: bir kelimenin kaç farklı kartın kelime havuzunda geçtiği.
const WORD_DOCUMENT_FREQUENCY = new Map<string, number>();
for (const corpus of CARD_CORPORA.values()) {
  for (const word of corpus) {
    WORD_DOCUMENT_FREQUENCY.set(
      word,
      (WORD_DOCUMENT_FREQUENCY.get(word) ?? 0) + 1,
    );
  }
}

// "kumaş" gibi neredeyse her kartta geçen genel kelimeler, spesifik olmayan
// kartları yanlışlıkla öne çıkarabilir. Nadir kelimelere (az kartta geçen,
// dolayısıyla ayırt edici) daha yüksek, çok yaygın kelimelere daha düşük ağırlık
// vererek bunun önüne geçilir (basit bir doküman frekansı / IDF yaklaşımı).
const RARE_DOCUMENT_THRESHOLD = 3;
const COMMON_DOCUMENT_THRESHOLD = 15;
const RARE_WORD_MULTIPLIER = 1.5;
const COMMON_WORD_MULTIPLIER = 0.5;

function documentFrequencyWeight(word: string): number {
  const documentFrequency = WORD_DOCUMENT_FREQUENCY.get(word) ?? 0;
  if (documentFrequency > 0 && documentFrequency <= RARE_DOCUMENT_THRESHOLD) {
    return RARE_WORD_MULTIPLIER;
  }
  if (documentFrequency >= COMMON_DOCUMENT_THRESHOLD) {
    return COMMON_WORD_MULTIPLIER;
  }
  return 1;
}

// Sorudaki her kelimeyi kartın anahtarKelimeler + baslik kelimeleriyle karşılaştırır.
// Tam eşleşme EXACT_MATCH_SCORE, kök (ilk MIN_STEM_LENGTH karakter) eşleşmesi
// STEM_MATCH_SCORE taban puanı alır; bu sayede "hesaplama" ~ "hesaplanır",
// "paketleme" ~ "paketlemede" gibi çekimli hâller de -tek tek karta özel bir
// liste tutmadan- yakalanır. Bu taban puan, eşleşen kelimenin doküman
// frekansına göre ağırlıklandırılır (nadir kelimeler ×1.5, çok yaygın
// kelimeler ×0.5). En yüksek skorlu kart döndürülür.
export function searchKnowledgeLibrary(
  question: string,
): KnowledgeCardMatch | null {
  const questionWords = new Set(tokenize(question));
  let best: KnowledgeCardMatch | null = null;

  for (const card of TEXTILE_KNOWLEDGE_LIBRARY) {
    const keywordWords = CARD_CORPORA.get(card) ?? buildCardCorpus(card);

    let score = 0;
    for (const word of questionWords) {
      if (keywordWords.has(word)) {
        score += EXACT_MATCH_SCORE * documentFrequencyWeight(word);
        continue;
      }

      const stemMatch = [...keywordWords].find((keyword) =>
        sharesStem(word, keyword),
      );
      if (stemMatch) {
        score += STEM_MATCH_SCORE * documentFrequencyWeight(stemMatch);
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { card, score };
    }
  }

  return best;
}
