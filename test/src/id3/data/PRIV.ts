export const PRIV = new Uint8Array([
	// ID3 (3 bytes)
	73, 68, 51, 

	// Version (2 bytes) i.e 2.4.0
	4, 0,

	// Flags (1 byte)
	0, 
	
	// Size (4 bytes)
	0, 0, 0, 79,

	// PRIV (4 bytes)
	80, 82, 73, 86, 

	// Size (4 bytes) 39 + 1 + 29 = 69
	0, 0, 0, 69,

	// Flags (2 bytes)
	0, 0,

	// Owner identifier (39 bytes) com.elementaltechnologies.timestamp.utc 
	99, 111, 109, 46, 101, 108, 101, 109, 101, 110, 116, 97, 108, 116, 101, 99, 104, 110, 111, 108, 111, 103, 105, 101, 115, 46, 116, 105, 109, 101, 115, 116, 97, 109, 112, 46, 117, 116, 99,
	
	// Terminator (1 byte)
	0, 

	// Data (29 bytes) 2023-05-05T01:44:04.200+00:00 
	50, 48, 50, 51, 45, 48, 53, 45, 48, 53, 84, 48, 49, 58, 52, 52, 58, 48, 52, 46, 50, 48, 48, 43, 48, 48, 58, 48, 48,
]);
