(function (BrowserFS$740) {
    'use strict';
    var mask_bits$741 = [
        0,
        1,
        3,
        7,
        15,
        31,
        63,
        127,
        255,
        511,
        1023,
        2047,
        4095,
        8191,
        16383,
        32767,
        65535
    ];
    var ByteBuff$742 = function ByteBuff$742(buff$790) {
        this._i = 0;
        this._bitsLeft = 0;
        this._bitbuf = 0;
        this._zipeof = false;
        this._buff = buff$790;
    };
    ByteBuff$742.prototype.readByte = function readByte() {
        var // Will be undefined if reading beyond array.
        rv$791 = this._buff[this._i++];
        return rv$791 === undefined ? 0 : rv$791;
    };
    /**
 * readBits (used by unshrink)
 * Do not mix this with readByte!
 */
    ByteBuff$742.prototype.readBits = function readBits(nbits$792) {
        var this$1$793 = this;
        if (nbits$792 > this._bitsLeft) {
            var temp$795;
            this._zipeof = true;
            while (this._bitsLeft <= 8 * 3 && !this.eof()) {
                this$1$793._zipeof = false;
                temp$795 = this$1$793.readByte();
                this$1$793._bitbuf |= temp$795 << this$1$793._bitsLeft;
                this$1$793._bitsLeft += 8;
            }
        }
        var zdest$794 = this._bitbuf & mask_bits$741[nbits$792];
        this._bitbuf >>>= nbits$792;
        this._bitsLeft -= nbits$792;
        return zdest$794;
    };
    ByteBuff$742.prototype.zipeof = function zipeof() {
        return this._zipeof;
    };
    ByteBuff$742.prototype.eof = function eof() {
        return this._i === this._buff.byteLength;
    };
    ByteBuff$742.prototype.size = function size() {
        return this._buff.byteLength;
    };
    var MAX_BITS$743 = 13;
    var /* used in unshrink() */
    HSIZE$744 = 1 << MAX_BITS$743;
    var /* size of global work area */
    /**
 *   struct {                 // unshrink():
 *     shrint Parent[HSIZE];    // (8192 * sizeof(shrint)) == 16KB minimum
 *     uch value[HSIZE];        // 8KB
 *     uch Stack[HSIZE];        // 8KB
 *   } shrink;                  // total = 32KB minimum; 80KB on Cray/Alpha
 */
    UnshrinkWorkStruct$745 = function UnshrinkWorkStruct$745() {
        this.Parent = new Int16Array(HSIZE$744);
        this.value = new Uint8Array(HSIZE$744);
        this.Stack = new Uint8Array(HSIZE$744);
    };
    var _unshrinkWorkStructFreeList$746 = [];
    function get_work_struct_unshrink$747() {
        if (_unshrinkWorkStructFreeList$746.length > 0) {
            return _unshrinkWorkStructFreeList$746.pop();
        } else {
            return new UnshrinkWorkStruct$745();
        }
    }
    function release_work_struct_unshrink$748(workStruct$796) {
        _unshrinkWorkStructFreeList$746.push(workStruct$796);
    }
    var slideFreeList$749 = [];
    function get_slide$750() {
        if (slideFreeList$749.length === 0) {
            return new Uint8Array(8193 * 4);
        } else {
            return slideFreeList$749.pop();
        }
    }
    function release_slide$751(slide$797) {
        slideFreeList$749.push(slide$797);
    }
    var /**
 * A pointer to an array element.
 */
    Ptr$752 = function Ptr$752(arr$798, i$799) {
        this._arr = arr$798;
        this._i = i$799;
    };
    Ptr$752.prototype.reset = function reset(arr$800, i$801) {
        this._arr = arr$800;
        this._i = i$801;
        return this;
    };
    /**
 * Pointer arithmetic.
 */
    Ptr$752.prototype.add = function add(n$802) {
        this._i += n$802;
        return this;
    };
    Ptr$752.prototype.getIndex = function getIndex() {
        return this._i;
    };
    Ptr$752.prototype.getArray = function getArray() {
        return this._arr;
    };
    Ptr$752.prototype.addInto = function addInto(ptr$803, n$804) {
        ptr$803._i = this._i + n$804;
        ptr$803._arr = this._arr;
        return ptr$803;
    };
    Ptr$752.prototype.cloneInto = function cloneInto(ptr$805) {
        ptr$805._i = this._i;
        ptr$805._arr = this._arr;
        return ptr$805;
    };
    Ptr$752.prototype.clone = function clone() {
        return new Ptr$752(this._arr, this._i);
    };
    Ptr$752.prototype.get = function get() {
        return this._arr[this._i];
    };
    Ptr$752.prototype.getOffset = function getOffset(i$806) {
        return this._arr[this._i + i$806];
    };
    Ptr$752.prototype.setOffset = function setOffset(i$807, v$808) {
        this._arr[this._i + i$807] = v$808;
    };
    Ptr$752.prototype.set = function set(val$809) {
        this._arr[this._i] = val$809;
    };
    /* If BMAX needs to be larger than 16, then h and x[] should be ulg. */
    var BMAX$753 = 16;
    /* maximum bit length of any code (16 for explode) */
    var N_MAX$754 = 288;
    /* maximum number of codes in any set */
    var INVALID_CODE$755 = 99;
    function flush$756(slide$810, out$811, outIndex$812, size$813) {
        var OUTBUFSIZ$814 = out$811.byteLength;
        if (outIndex$812 + size$813 > OUTBUFSIZ$814) {
            return -1;
        } else {
            out$811.set(slide$810.subarray(0, size$813), outIndex$812);
        }
        return 0;
    }
    function create_empty_huft_table$757(n$815) {
        var rv$816 = new Array(n$815);
        for (var i$817 = 0; i$817 < n$815; i$817++) {
            rv$816[i$817] = {
                e: 0,
                b: 0,
                v: new Ptr$752(null, null)
            };
        }
        return rv$816;
    }
    function clone_huft$758(a$818, b$819) {
        b$819.e = a$818.e;
        b$819.b = a$818.b;
        if (typeof a$818.v === 'number') {
            b$819.v = a$818.v;
        } else {
            a$818.v.cloneInto(b$819.v);
        }
    }
    function huft_build$759(b$820, n$821, s$822, d$823, e$824, output$825) {
        var a$826;
        var /* counter for codes of length k */
        c$827 = new Uint32Array(BMAX$753 + 1);
        /* bit length count table */
        var el$828;
        /* length of EOB code (value 256) */
        var f$829;
        /* i repeats in table every f entries */
        var g$830;
        /* maximum code length */
        var h$831;
        /* table level */
        var i$832;
        /* counter, current code */
        var j$833;
        /* counter */
        var k$834;
        var /* number of bits in current code */
        lx$835 = new Int32Array(BMAX$753 + 1);
        var /* memory for l[-1..BMAX-1] */
        l$836 = new Ptr$752(lx$835, 1);
        var /* stack of bits per table */
        p$837 = new Ptr$752(null, null);
        var /* pointer into c[], b[], or v[] */
        q$838 = new Ptr$752(null, null);
        var /* points to current table */
        r$839 = {
            e: 0,
            b: 0,
            v: 0
        };
        var u$840 = new Array(BMAX$753);
        var /* table stack */
        v$841 = new Uint32Array(N_MAX$754);
        /* values in order of bit length */
        var w$842;
        var /* bits before this table == (l * h) */
        x$843 = new Uint32Array(BMAX$753 + 1);
        var /* bit offsets, then code stack */
        xp$844 = new Ptr$752(null, null);
        /* pointer into x */
        var y$845;
        /* number of dummy codes added */
        var z$846;
        var /* number of entries in current table */
        t$847 = output$825.t;
        /* Generate counts for each bit length */
        // Unneeded, since typed arrays are initialized to 0.
        el$828 = n$821 > 256 ? b$820[256] : BMAX$753;
        /* set length of EOB code, if any */
        // memset(c, 0, sizeof(c));
        p$837.reset(b$820, 0);
        i$832 = n$821;
        do {
            c$827[p$837.get()]++;
            /* assume all entries <= BMAX */
            p$837.add(1);
        } while (--i$832);
        if (c$827[0] === n$821) {
            t$847.reset(null, null);
            output$825.m = 0;
            return 0;
        }
        for (/* Find minimum and maximum length, bound *m by those */
            j$833 = 1; j$833 <= BMAX$753; j$833++) {
            if (c$827[j$833]) {
                break;
            }
        }
        k$834 = j$833;
        if (/* minimum code length */
            output$825.m < j$833) {
            output$825.m = j$833;
        }
        for (i$832 = BMAX$753; i$832; i$832--) {
            if (c$827[i$832]) {
                break;
            }
        }
        g$830 = i$832;
        if (/* maximum code length */
            output$825.m > i$832) {
            output$825.m = i$832;
        }
        for (/* Adjust last length count to fill out codes, if needed */
            y$845 = 1 << j$833; j$833 < i$832; j$833++, y$845 <<= 1) {
            if ((y$845 -= c$827[j$833]) < 0) {
                return 2;
            }
        }
        if ((/* bad input: more codes than bits */
            y$845 -= c$827[i$832]) < 0) {
            return 2;
        }
        c$827[i$832] += y$845;
        /* Generate starting offsets into the value table for each length */
        x$843[1] = j$833 = 0;
        p$837.reset(c$827, 1);
        xp$844.reset(x$843, 2);
        while (--i$832) {
            xp$844.set(j$833 += p$837.get());
            p$837.add(1);
            xp$844.add(1);
        }
        /* Make a table of values in order of bit lengths */
        // v is already zeroed
        // memzero((char *)v, sizeof(v));
        p$837.reset(b$820, 0);
        i$832 = 0;
        do {
            if ((j$833 = p$837.get()) !== 0) {
                v$841[x$843[j$833]++] = i$832;
            }
            p$837.add(1);
        } while (++i$832 < n$821);
        n$821 = x$843[g$830];
        /* set n to length of v */
        /* Generate the Huffman codes and for each, make the table entries */
        x$843[0] = i$832 = 0;
        /* first Huffman code is zero */
        p$837.reset(v$841, 0);
        /* grab values in bit order */
        h$831 = -1;
        /* no tables yet--level -1 */
        w$842 = 0;
        /* no bits decoded yet */
        l$836.setOffset(-1, 0);
        u$840[0] = null;
        /* just to keep compilers happy */
        q$838.reset(null, null);
        /* ditto */
        z$846 = 0;
        for (; /* ditto */
            /* go through the bit lengths (k already is bits in shortest code) */
            k$834 <= g$830; k$834++) {
            a$826 = c$827[k$834];
            while (a$826--) {
                while (/* here i is the Huffman code of length k bits for value *p */
                    /* make tables up to required level */
                    k$834 > w$842 + l$836.getOffset(h$831)) {
                    w$842 += l$836.getOffset(h$831++);
                    /* add bits already decoded */
                    /* compute minimum size table less than or equal to *m bits */
                    z$846 = (z$846 = g$830 - w$842) > output$825.m ? output$825.m : z$846;
                    if ((/* upper limit */
                        f$829 = 1 << (j$833 = k$834 - w$842)) > a$826 + 1) {
                        f$829 -= a$826 + 1;
                        /* deduct codes from patterns left */
                        xp$844.reset(c$827, k$834);
                        while (++j$833 < z$846) {
                            if ((f$829 <<= 1) <= xp$844.add(1).get()) {
                                break;
                            }
                            /* enough codes to use up j bits */
                            f$829 -= xp$844.get();
                        }
                    }
                    if (w$842 + j$833 > el$828 && w$842 < el$828) {
                        j$833 = el$828 - w$842;
                    }
                    /* make EOB code end at table */
                    z$846 = 1 << j$833;
                    /* table entries for j-bit table */
                    l$836.setOffset(h$831, j$833);
                    /* set table size in stack */
                    /* allocate and link in new table */
                    q$838.reset(create_empty_huft_table$757(z$846 + 1), 0);
                    q$838.addInto(t$847, 1);
                    /* link to list for huft_free() */
                    t$847 = q$838.get().v;
                    u$840[h$831] = q$838.add(1).clone();
                    if (/* table starts after link */
                        /* connect to last table, if there is one */
                        h$831) {
                        x$843[h$831] = i$832;
                        /* save pattern for backing up */
                        r$839.b = l$836.getOffset(h$831 - 1);
                        /* bits to dump before this table */
                        r$839.e = 32 + j$833;
                        /* bits in this table */
                        r$839.v = q$838.clone();
                        /* pointer to this table */
                        j$833 = (i$832 & (1 << w$842) - 1) >> w$842 - l$836.getOffset(h$831 - 1);
                        clone_huft$758(r$839, u$840[h$831 - 1].getOffset(j$833));
                    }
                }
                /* set up table entry in r */
                r$839.b = k$834 - w$842;
                if (p$837.getIndex() >= n$821) {
                    r$839.e = INVALID_CODE$755;
                } else if (/* out of values--invalid code */
                    p$837.get() < s$822) {
                    r$839.e = p$837.get() < 256 ? 32 : 31;
                    /* 256 is end-of-block code */
                    r$839.v = p$837.get();
                    /* simple code is just the value */
                    p$837.add(1);
                } else {
                    r$839.e = e$824[p$837.get() - s$822];
                    /* non-simple--look up in lists */
                    r$839.v = d$823[p$837.get() - s$822];
                    p$837.add(1);
                }
                /* fill code-like entries with r */
                f$829 = 1 << k$834 - w$842;
                for (j$833 = i$832 >> w$842; j$833 < z$846; j$833 += f$829) {
                    clone_huft$758(r$839, q$838.getOffset(j$833));
                }
                for (/* backwards increment the k-bit code i */
                    j$833 = 1 << k$834 - 1; i$832 & j$833; j$833 >>= 1) {
                    i$832 ^= j$833;
                }
                i$832 ^= j$833;
                while ((/* backup over finished tables */
                    i$832 & (1 << w$842) - 1) !== x$843[h$831]) {
                    w$842 -= l$836.getOffset(--h$831);
                }
            }
        }
        /* return actual size of base table */
        output$825.m = l$836.getOffset(0);
        return y$845 !== 0 && g$830 !== 1 ? 1 : 0;
    }
    /*
  Copyright (c) 1990-2007 Info-ZIP.  All rights reserved.

  See the accompanying file LICENSE, version 2007-Mar-04 or later
  (the contents of which are also included in unzip.h) for terms of use.
  If, for some reason, all these files are missing, the Info-ZIP license
  also may be found at:  ftp://ftp.info-zip.org/pub/infozip/license.html
*/
    /* explode.c -- by Mark Adler
   version c17d, 01 December 2007 */
    var WSIZE$760 = 32768;
    var /* window size--must be a power of two, and at least
                           8K for zip's implode method */
    wszimpl$761 = WSIZE$760 >> 1;
    var /* The implode algorithm uses a sliding 4K or 8K byte window on the
   uncompressed stream to find repeated byte strings.  This is implemented
   here as a circular buffer.  The index is updated simply by incrementing
   and then and'ing with 0x0fff (4K-1) or 0x1fff (8K-1).  Here, the 32K
   buffer of inflate is used, and it works just as well to always have
   a 32K circular buffer, so the index is anded with 0x7fff.  This is
   done to allow the window to also be used as the output buffer. */
    /* This must be supplied in an external module useable like "uch slide[8192];"
   or "uch *slide;", where the latter would be malloc'ed.  In unzip, slide[]
   is actually a 32K area for use by inflate, which uses a 32K sliding window.
 */
    /* Tables for length and distance */
    cplen2$762 = [
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        64,
        65
    ];
    var cplen3$763 = [
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        64,
        65,
        66
    ];
    var extra$764 = [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        8
    ];
    var cpdist4$765 = [
        1,
        65,
        129,
        193,
        257,
        321,
        385,
        449,
        513,
        577,
        641,
        705,
        769,
        833,
        897,
        961,
        1025,
        1089,
        1153,
        1217,
        1281,
        1345,
        1409,
        1473,
        1537,
        1601,
        1665,
        1729,
        1793,
        1857,
        1921,
        1985,
        2049,
        2113,
        2177,
        2241,
        2305,
        2369,
        2433,
        2497,
        2561,
        2625,
        2689,
        2753,
        2817,
        2881,
        2945,
        3009,
        3073,
        3137,
        3201,
        3265,
        3329,
        3393,
        3457,
        3521,
        3585,
        3649,
        3713,
        3777,
        3841,
        3905,
        3969,
        4033
    ];
    var cpdist8$766 = [
        1,
        129,
        257,
        385,
        513,
        641,
        769,
        897,
        1025,
        1153,
        1281,
        1409,
        1537,
        1665,
        1793,
        1921,
        2049,
        2177,
        2305,
        2433,
        2561,
        2689,
        2817,
        2945,
        3073,
        3201,
        3329,
        3457,
        3585,
        3713,
        3841,
        3969,
        4097,
        4225,
        4353,
        4481,
        4609,
        4737,
        4865,
        4993,
        5121,
        5249,
        5377,
        5505,
        5633,
        5761,
        5889,
        6017,
        6145,
        6273,
        6401,
        6529,
        6657,
        6785,
        6913,
        7041,
        7169,
        7297,
        7425,
        7553,
        7681,
        7809,
        7937,
        8065
    ];
    function get_tree$767(byteBuff$848, l$849, n$850) {
        var i$851;
        /* bytes remaining in list */
        var j$852;
        /* number of codes */
        var k$853;
        /* lengths entered */
        var b$854;
        /* bit length for those codes */
        i$851 = byteBuff$848.readByte() + 1;
        /* length/count pairs to read */
        k$853 = 0;
        do {
            var /* next code */
            byte$855 = byteBuff$848.readByte();
            b$854 = ((j$852 = byte$855) & 15) + 1;
            /* bits in code (1..16) */
            j$852 = ((j$852 & 240) >> 4) + 1;
            if (/* codes with those bits (1..16) */
                k$853 + j$852 > n$850) {
                return 4;
            }
            do {
                /* don't overflow l[] */
                l$849[k$853++] = b$854;
            } while (--j$852);
        } while (--i$851);
        return k$853 !== n$850 ? 4 : 0;
    }
    function explode_lit$768(slide$856, byteBuff$857, output$858, ucsize$859, tb$860, tl$861, td$862, bb$863, bl$864, bd$865, bdl$866) {
        var s$867;
        /* bytes to decompress */
        var e$868;
        var
            /* table entry flag/number of extra bits */
            n$869,
            /* length and index for copy */
            d$870;
        var w$871;
        var /* current window position */
        t$872 = new Ptr$752(null, null);
        var
            /* pointer to table entry */
            mb$873,
            /* masks for bb, bl, and bd bits */
            ml$874, md$875;
        var mdl$876;
        /* mask for bdl (distance lower) bits */
        var b$877;
        /* bit buffer */
        var k$878;
        /* number of bits in bit buffer */
        var u$879;
        /* true if unflushed */
        var retval$880 = 0;
        /* error code returned: initialized to "no error" */
        var outcnt$881 = 0;
        /* explode the coded data */
        b$877 = k$878 = w$871 = 0;
        /* initialize bit buffer, window */
        u$879 = 1;
        /* buffer unflushed */
        mb$873 = mask_bits$741[bb$863];
        /* precompute masks for speed */
        ml$874 = mask_bits$741[bl$864];
        md$875 = mask_bits$741[bd$865];
        mdl$876 = mask_bits$741[bdl$866];
        s$867 = ucsize$859;
        while (s$867 > 0) {
            while (k$878 < 1) {
                b$877 |= byteBuff$857.readByte() << k$878;
                k$878 += 8;
            }
            ;
            if (b$877 & 1) {
                b$877 >>= 1;
                k$878 -= 1;
                ;
                s$867--;
                while (k$878 < bb$863) {
                    b$877 |= byteBuff$857.readByte() << k$878;
                    k$878 += 8;
                }
                ;
                tb$860.addInto(t$872, ~b$877 & mb$873);
                while (1) {
                    var __macro_tmp$889 = t$872.get().b;
                    b$877 >>= __macro_tmp$889;
                    k$878 -= __macro_tmp$889;
                    ;
                    if ((e$868 = t$872.get().e) <= 32)
                        break;
                    if (e$868 === 99)
                        return 1;
                    e$868 &= 31;
                    while (k$878 < e$868) {
                        b$877 |= byteBuff$857.readByte() << k$878;
                        k$878 += 8;
                    }
                    ;
                    t$872.get().v.addInto(t$872, ~b$877 & mask_bits$741[e$868]);
                }
                ;
                slide$856[w$871++] = t$872.get().v;
                if (w$871 === wszimpl$761) {
                    if ((retval$880 = flush$756(slide$856, output$858, outcnt$881, w$871)) !== 0) {
                        return retval$880;
                    }
                    outcnt$881 += w$871;
                    w$871 = u$879 = 0;
                }
            } else {
                b$877 >>= 1;
                k$878 -= 1;
                ;
                while (k$878 < bdl$866) {
                    b$877 |= byteBuff$857.readByte() << k$878;
                    k$878 += 8;
                }
                ;
                /* get distance low bits */
                d$870 = b$877 & mdl$876;
                b$877 >>= bdl$866;
                k$878 -= bdl$866;
                ;
                while (k$878 < bd$865) {
                    b$877 |= byteBuff$857.readByte() << k$878;
                    k$878 += 8;
                }
                ;
                td$862.addInto(t$872, ~b$877 & md$875);
                while (1) {
                    var __macro_tmp$903 = t$872.get().b;
                    b$877 >>= __macro_tmp$903;
                    k$878 -= __macro_tmp$903;
                    ;
                    if ((e$868 = t$872.get().e) <= 32)
                        break;
                    if (e$868 === 99)
                        return 1;
                    e$868 &= 31;
                    while (k$878 < e$868) {
                        b$877 |= byteBuff$857.readByte() << k$878;
                        k$878 += 8;
                    }
                    ;
                    t$872.get().v.addInto(t$872, ~b$877 & mask_bits$741[e$868]);
                }
                ;
                /* get coded distance high bits */
                d$870 = w$871 - d$870 - t$872.get().v;
                while (k$878 < /* construct offset */
                    bl$864) {
                    b$877 |= byteBuff$857.readByte() << k$878;
                    k$878 += 8;
                }
                ;
                tl$861.addInto(t$872, ~b$877 & ml$874);
                while (1) {
                    var __macro_tmp$909 = t$872.get().b;
                    b$877 >>= __macro_tmp$909;
                    k$878 -= __macro_tmp$909;
                    ;
                    if ((e$868 = t$872.get().e) <= 32)
                        break;
                    if (e$868 === 99)
                        return 1;
                    e$868 &= 31;
                    while (k$878 < e$868) {
                        b$877 |= byteBuff$857.readByte() << k$878;
                        k$878 += 8;
                    }
                    ;
                    t$872.get().v.addInto(t$872, ~b$877 & mask_bits$741[e$868]);
                }
                ;
                /* get coded length */
                n$869 = t$872.get().v;
                if (e$868) {
                    while (k$878 < 8) {
                        b$877 |= byteBuff$857.readByte() << k$878;
                        k$878 += 8;
                    }
                    ;
                    n$869 += b$877 & 255;
                    b$877 >>= 8;
                    k$878 -= 8;
                    ;
                }
                /* do the copy */
                s$867 = s$867 > n$869 ? s$867 - n$869 : 0;
                do {
                    e$868 = wszimpl$761 - ((d$870 &= wszimpl$761 - 1) > w$871 ? d$870 : w$871);
                    if (e$868 > n$869) {
                        e$868 = n$869;
                    }
                    n$869 -= e$868;
                    if (u$879 && w$871 <= d$870) {
                        for (var i$916 = 0; i$916 < e$868; i$916++) {
                            slide$856[w$871 + i$916] = 0;
                        }
                        w$871 += e$868;
                        d$870 += e$868;
                    } else {
                        do {
                            slide$856[w$871++] = slide$856[d$870++];
                        } while (--e$868);
                    }
                    if (w$871 === wszimpl$761) {
                        if ((retval$880 = flush$756(slide$856, output$858, outcnt$881, w$871)) !== 0) {
                            return retval$880;
                        }
                        outcnt$881 += w$871;
                        w$871 = u$879 = 0;
                    }
                } while (n$869);
            }
        }
        if ((/* flush out slide */
            retval$880 = flush$756(slide$856, output$858, outcnt$881, w$871)) !== 0) {
            return retval$880;
        }
        outcnt$881 += w$871;
        return byteBuff$857.eof() ? 0 : 5;
    }
    function explode_nolit$769(slide$917, byteBuff$918, output$919, ucsize$920, tl$921, td$922, bl$923, bd$924, bdl$925) {
        var s$926;
        /* bytes to decompress */
        var e$927;
        var
            /* table entry flag/number of extra bits */
            n$928,
            /* length and index for copy */
            d$929;
        var w$930;
        var /* current window position */
        t$931 = new Ptr$752(null, null);
        var
            /* pointer to table entry */
            ml$932,
            /* masks for bl and bd bits */
            md$933;
        var mdl$934;
        /* mask for bdl (distance lower) bits */
        var b$935;
        /* bit buffer */
        var k$936;
        /* number of bits in bit buffer */
        var u$937;
        /* true if unflushed */
        var retval$938 = 0;
        /* error code returned: initialized to "no error" */
        var outcnt$939 = 0;
        /* explode the coded data */
        b$935 = k$936 = w$930 = 0;
        /* initialize bit buffer, window */
        u$937 = 1;
        /* buffer unflushed */
        ml$932 = mask_bits$741[bl$923];
        /* precompute masks for speed */
        md$933 = mask_bits$741[bd$924];
        mdl$934 = mask_bits$741[bdl$925];
        s$926 = ucsize$920;
        while (s$926 > 0) {
            while (k$936 < 1) {
                b$935 |= byteBuff$918.readByte() << k$936;
                k$936 += 8;
            }
            ;
            if (b$935 & 1) {
                b$935 >>= 1;
                k$936 -= 1;
                ;
                s$926--;
                while (k$936 < 8) {
                    b$935 |= byteBuff$918.readByte() << k$936;
                    k$936 += 8;
                }
                ;
                slide$917[w$930++] = b$935;
                if (w$930 === wszimpl$761) {
                    if ((retval$938 = flush$756(slide$917, output$919, outcnt$939, w$930)) !== 0) {
                        return retval$938;
                    }
                    outcnt$939 += w$930;
                    w$930 = u$937 = 0;
                }
                b$935 >>= 8;
                k$936 -= 8;
                ;
            } else {
                b$935 >>= 1;
                k$936 -= 1;
                ;
                while (k$936 < bdl$925) {
                    b$935 |= byteBuff$918.readByte() << k$936;
                    k$936 += 8;
                }
                ;
                /* get distance low bits */
                d$929 = b$935 & mdl$934;
                b$935 >>= bdl$925;
                k$936 -= bdl$925;
                ;
                while (k$936 < bd$924) {
                    b$935 |= byteBuff$918.readByte() << k$936;
                    k$936 += 8;
                }
                ;
                td$922.addInto(t$931, ~b$935 & md$933);
                while (1) {
                    var __macro_tmp$956 = t$931.get().b;
                    b$935 >>= __macro_tmp$956;
                    k$936 -= __macro_tmp$956;
                    ;
                    if ((e$927 = t$931.get().e) <= 32)
                        break;
                    if (e$927 === 99)
                        return 1;
                    e$927 &= 31;
                    while (k$936 < e$927) {
                        b$935 |= byteBuff$918.readByte() << k$936;
                        k$936 += 8;
                    }
                    ;
                    t$931.get().v.addInto(t$931, ~b$935 & mask_bits$741[e$927]);
                }
                ;
                /* get coded distance high bits */
                d$929 = w$930 - d$929 - t$931.get().v;
                while (k$936 < /* construct offset */
                    //assert(typeof(t.get().v) === 'number');
                    bl$923) {
                    b$935 |= byteBuff$918.readByte() << k$936;
                    k$936 += 8;
                }
                ;
                tl$921.addInto(t$931, ~b$935 & ml$932);
                while (1) {
                    var __macro_tmp$962 = t$931.get().b;
                    b$935 >>= __macro_tmp$962;
                    k$936 -= __macro_tmp$962;
                    ;
                    if ((e$927 = t$931.get().e) <= 32)
                        break;
                    if (e$927 === 99)
                        return 1;
                    e$927 &= 31;
                    while (k$936 < e$927) {
                        b$935 |= byteBuff$918.readByte() << k$936;
                        k$936 += 8;
                    }
                    ;
                    t$931.get().v.addInto(t$931, ~b$935 & mask_bits$741[e$927]);
                }
                ;
                /* get coded length */
                n$928 = t$931.get().v;
                if (//assert(typeof(t.get().v) === 'number');
                    e$927) {
                    while (k$936 < 8) {
                        b$935 |= byteBuff$918.readByte() << k$936;
                        k$936 += 8;
                    }
                    ;
                    n$928 += b$935 & 255;
                    b$935 >>= 8;
                    k$936 -= 8;
                    ;
                }
                /* do the copy */
                s$926 = s$926 > n$928 ? s$926 - n$928 : 0;
                do {
                    e$927 = wszimpl$761 - ((d$929 &= wszimpl$761 - 1) > w$930 ? d$929 : w$930);
                    if (e$927 > n$928) {
                        e$927 = n$928;
                    }
                    n$928 -= e$927;
                    if (u$937 && w$930 <= d$929) {
                        for (var i$969 = 0; i$969 < e$927; i$969++) {
                            slide$917[w$930 + i$969] = 0;
                        }
                        w$930 += e$927;
                        d$929 += e$927;
                    } else {
                        do {
                            slide$917[w$930++] = slide$917[d$929++];
                        } while (--e$927);
                    }
                    if (w$930 === wszimpl$761) {
                        if ((retval$938 = flush$756(slide$917, output$919, outcnt$939, w$930)) !== 0) {
                            return retval$938;
                        }
                        outcnt$939 += w$930;
                        w$930 = u$937 = 0;
                    }
                } while (n$928);
            }
        }
        if ((/* flush out slide */
            retval$938 = flush$756(slide$917, output$919, outcnt$939, w$930)) !== 0) {
            return retval$938;
        }
        outcnt$939 += w$930;
        return byteBuff$918.eof() ? 0 : 5;
    }
    function explode$770(general_purpose_bit_flag$970, compressedData$971, output$972, ucsize$973) {
        if (ucsize$973 === void 0)
            ucsize$973 = output$972.byteLength;
        var r$974;
        /* return codes */
        var tb$975;
        /* literal code table */
        var tl$976;
        /* length code table */
        var td$977;
        /* distance code table */
        var bb$978;
        /* bits for tb */
        var bl$979;
        /* bits for tl */
        var bd$980;
        /* bits for td */
        var bdl$981;
        var /* number of uncoded lower distance bits */
        l$982 = new Array(256);
        var /* bit lengths for codes */
        byteBuff$983 = new ByteBuff$742(compressedData$971);
        if (ucsize$973 > output$972.byteLength) {
            throw new Error('Output buffer is too short for ' + ucsize$973 + ' bytes of uncompressed data!');
        }
        /* Tune base table sizes.  Note: I thought that to truly optimize speed,
       I would have to select different bl, bd, and bb values for different
       compressed file sizes.  I was suprised to find out the the values of
       7, 7, and 9 worked best over a very wide range of sizes, except that
       bd = 8 worked marginally better for large compressed sizes. */
        bl$979 = 7;
        bd$980 = byteBuff$983.size() > 200000 ? 8 : 7;
        var // Output of huft build.
        hb_output$984 = {
            t: new Ptr$752(null, null),
            m: -1
        };
        if (/* With literal tree--minimum match length is 3 */
            general_purpose_bit_flag$970 & 4) {
            bb$978 = 9;
            if ((/* base table size for literals */
                r$974 = get_tree$767(byteBuff$983, l$982, 256)) != 0) {
                return r$974;
            }
            hb_output$984.m = bb$978;
            if ((r$974 = huft_build$759(l$982, 256, 256, null, null, hb_output$984)) !== 0) {
                return r$974;
            } else {
                bb$978 = hb_output$984.m;
                tb$975 = hb_output$984.t.clone();
            }
            if ((r$974 = get_tree$767(byteBuff$983, l$982, 64)) != 0) {
                return r$974;
            }
            hb_output$984.m = bl$979;
            if ((r$974 = huft_build$759(l$982, 64, 0, cplen3$763, extra$764, hb_output$984)) !== 0) {
                return r$974;
            } else {
                bl$979 = hb_output$984.m;
                tl$976 = hb_output$984.t.clone();
            }
        } else {
            /* No literal tree--minimum match length is 2 */
            tb$975 = null;
            if ((r$974 = get_tree$767(byteBuff$983, l$982, 64)) !== 0) {
                return r$974;
            }
            hb_output$984.m = bl$979;
            if ((r$974 = huft_build$759(l$982, 64, 0, cplen2$762, extra$764, hb_output$984)) !== 0) {
                return r$974;
            } else {
                bl$979 = hb_output$984.m;
                tl$976 = hb_output$984.t.clone();
            }
        }
        if ((r$974 = get_tree$767(byteBuff$983, l$982, 64)) !== 0) {
            return r$974;
        }
        if (general_purpose_bit_flag$970 & 2) {
            bdl$981 = 7;
            hb_output$984.m = bd$980;
            if ((r$974 = huft_build$759(l$982, 64, 0, cpdist8$766, extra$764, hb_output$984)) !== 0) {
                return r$974;
            } else {
                bd$980 = hb_output$984.m;
                td$977 = hb_output$984.t.clone();
            }
        } else {
            bdl$981 = 6;
            hb_output$984.m = bd$980;
            if ((r$974 = huft_build$759(l$982, 64, 0, cpdist4$765, extra$764, hb_output$984)) != 0) {
                return r$974;
            } else {
                bd$980 = hb_output$984.m;
                td$977 = hb_output$984.t.clone();
            }
        }
        if (r$974 !== 0) {
            return r$974;
        }
        var slide$985 = get_slide$750();
        if (tb$975 !== null) {
            r$974 = explode_lit$768(slide$985, byteBuff$983, output$972, ucsize$973, tb$975, tl$976, td$977, bb$978, bl$979, bd$980, bdl$981);
        } else {
            r$974 = explode_nolit$769(slide$985, byteBuff$983, output$972, ucsize$973, tl$976, td$977, bl$979, bd$980, bdl$981);
        }
        release_slide$751(slide$985);
        return r$974;
    }
    /*
  Copyright (c) 1990-2008 Info-ZIP.  All rights reserved.

  See the accompanying file LICENSE, version 2000-Apr-09 or later
  (the contents of which are also included in unzip.h) for terms of use.
  If, for some reason, all these files are missing, the Info-ZIP license
  also may be found at:  ftp://ftp.info-zip.org/pub/infozip/license.html
*/
    /*---------------------------------------------------------------------------

  unshrink.c                     version 1.22                     19 Mar 2008


       NOTE:  This code may or may not infringe on the so-called "Welch
       patent" owned by Unisys.  (From reading the patent, it appears
       that a pure LZW decompressor is *not* covered, but this claim has
       not been tested in court, and Unisys is reported to believe other-
       wise.)  It is therefore the responsibility of the user to acquire
       whatever license(s) may be required for legal use of this code.

       THE INFO-ZIP GROUP DISCLAIMS ALL LIABILITY FOR USE OF THIS CODE
       IN VIOLATION OF APPLICABLE PATENT LAW.


  Shrinking is basically a dynamic LZW algorithm with allowed code sizes of
  up to 13 bits; in addition, there is provision for partial clearing of
  leaf nodes.  PKWARE uses the special code 256 (decimal) to indicate a
  change in code size or a partial clear of the code tree:  256,1 for the
  former and 256,2 for the latter.  [Note that partial clearing can "orphan"
  nodes:  the parent-to-be can be cleared before its new child is added,
  but the child is added anyway (as an orphan, as though the parent still
  existed).  When the tree fills up to the point where the parent node is
  reused, the orphan is effectively "adopted."  Versions prior to 1.05 were
  affected more due to greater use of pointers (to children and siblings
  as well as parents).]

  This replacement version of unshrink.c was written from scratch.  It is
  based only on the algorithms described in Mark Nelson's _The Data Compres-
  sion Book_ and in Terry Welch's original paper in the June 1984 issue of
  IEEE _Computer_; no existing source code, including any in Nelson's book,
  was used.

  Memory requirements have been reduced in this version and are now no more
  than the original Sam Smith code.  This is still larger than any of the
  other algorithms:  at a minimum, 8K+8K+16K (stack+values+parents) assuming
  16-bit short ints, and this does not even include the output buffer (the
  other algorithms leave the uncompressed data in the work area, typically
  called slide[]).  For machines with a 64KB data space this is a problem,
  particularly when text conversion is required and line endings have more
  than one character.  UnZip's solution is to use two roughly equal halves
  of outbuf for the ASCII conversion in such a case; the "unshrink" argument
  to flush() signals that this is the case.

  For large-memory machines, a second outbuf is allocated for translations,
  but only if unshrinking and only if translations are required.

              | binary mode  |        text mode
    ---------------------------------------------------
    big mem   |  big outbuf  | big outbuf + big outbuf2  <- malloc'd here
    small mem | small outbuf | half + half small outbuf

  Copyright 1994, 1995 Greg Roelofs.  See the accompanying file "COPYING"
  in UnZip 5.20 (or later) source or binary distributions.

  ---------------------------------------------------------------------------*/
    /*
#ifdef DEBUG
#  define OUTDBG(c) \
   if ((c)<32 || (c)>=127) fprintf(stderr,"\\x%02x",(c)); else putc((c),stderr);
#else
#  define OUTDBG(c)
#endif
*/
    /*function OUTDBG(c: number): void {
  if ((c)<32 || (c)>=127) {
    process.stderr.write(`\\x${c}`);
  } else {
    process.stderr.write(String.fromCharCode(c));
  }
}*/
    /* HSIZE is defined as 2^13 (8192) in unzip.h (resp. unzpriv.h */
    var BOGUSCODE$771 = 256;
    var CODE_MASK$772 = HSIZE$744 - 1;
    /* 0x1fff (lower bits are parent's index) */
    var FREE_CODE$773 = HSIZE$744;
    var /* 0x2000 (code is unused or was cleared) */
    HAS_CHILD$774 = HSIZE$744 << 1;
    function unshrink$775(workStruct$986, compressedData$987, output$988, ucsize$989) {
        var parent$990 = workStruct$986.Parent;
        var /* upper bits of parent[] used as flag bits */
        FLAG_BITS$991 = workStruct$986.Parent;
        var Value$992 = workStruct$986.value;
        var stack$993 = workStruct$986.Stack;
        var stacktop$994 = new Ptr$752(stack$993, HSIZE$744 - 1);
        var newstr$995 = new Ptr$752(null, null);
        var finalval$996;
        var codesize$997 = 9, len$998;
        var code$999, oldcode$1000, curcode$1001;
        var lastfreecode$1002;
        var outptr$1003 = new Ptr$752(output$988, 0);
        /*---------------------------------------------------------------------------
        Initialize various variables.
      ---------------------------------------------------------------------------*/
        lastfreecode$1002 = BOGUSCODE$771;
        for (code$999 = 0; code$999 < BOGUSCODE$771; ++code$999) {
            Value$992[code$999] = code$999;
            parent$990[code$999] = BOGUSCODE$771;
        }
        for (code$999 = BOGUSCODE$771 + 1; code$999 < HSIZE$744; ++code$999) {
            parent$990[code$999] = FREE_CODE$773;
        }
        /*---------------------------------------------------------------------------
        Get and output first code, then loop over remaining ones.
      ---------------------------------------------------------------------------*/
        oldcode$1000 = compressedData$987.readBits(codesize$997);
        if (compressedData$987.zipeof()) {
            // console.log("OK");
            return 0;
        }
        /* OK */
        finalval$996 = oldcode$1000;
        // OUTDBG(finalval);
        outptr$1003.set(finalval$996);
        outptr$1003.add(1);
        while (1) {
            code$999 = compressedData$987.readBits(codesize$997);
            if (compressedData$987.zipeof()) {
                break;
            }
            if (code$999 === BOGUSCODE$771) {
                code$999 = compressedData$987.readBits(codesize$997);
                if (compressedData$987.zipeof()) {
                    break;
                }
                if (code$999 === 1) {
                    ++codesize$997;
                    if (// console.error(" (codesize now %d bits)\n", codesize);
                        codesize$997 > MAX_BITS$743) {
                        // console.log("codesize > MAX_BITS");
                        return 2;
                    }
                } else if (/* ERR */
                    code$999 === 2) {
                    // console.error(" (partial clear code)\n");
                    /* clear leafs (nodes with no children) */
                    partial_clear$776(parent$990, FLAG_BITS$991, lastfreecode$1002);
                    // console.error(" (done with partial clear)\n");
                    lastfreecode$1002 = BOGUSCODE$771;
                }
                continue;
            }
            /*-----------------------------------------------------------------------
            Translate code:  traverse tree from leaf back to root.
          -----------------------------------------------------------------------*/
            stacktop$994.cloneInto(newstr$995);
            curcode$1001 = code$999;
            if (parent$990[code$999] === FREE_CODE$773) {
                /* or (FLAG_BITS[code] & FREE_CODE)? */
                // console.error(" (found a KwKwK code %d; oldcode = %d)\n", code,
                //   oldcode);
                newstr$995.set(finalval$996);
                newstr$995.add(-1);
                code$999 = oldcode$1000;
            }
            while (code$999 !== BOGUSCODE$771) {
                if (newstr$995.getIndex() < 0) {
                    /* Bogus compression stream caused buffer underflow! */
                    // console.error("unshrink stack overflow!\n");
                    // console.log("newstr.getIndex() < 0");
                    return 2;
                }
                if (/* ERR */
                    parent$990[code$999] === FREE_CODE$773) {
                    /* or (FLAG_BITS[code] & FREE_CODE)? */
                    // console.error(" (found a KwKwK code %d; oldcode = %d)\n",
                    //   code, oldcode);
                    newstr$995.set(finalval$996);
                    newstr$995.add(-1);
                    code$999 = oldcode$1000;
                } else {
                    newstr$995.set(Value$992[code$999]);
                    newstr$995.add(-1);
                    code$999 = parent$990[code$999] & CODE_MASK$772;
                }
            }
            len$998 = stacktop$994.getIndex() - newstr$995.getIndex();
            newstr$995.add(1);
            finalval$996 = newstr$995.get();
            {
                var /*-----------------------------------------------------------------------
            Write expanded string in reverse order to output buffer.
          -----------------------------------------------------------------------*/
                // console.error("code %d; oldcode %d; char %d (%s); len %d; string [%s", curcode,
                //    oldcode, newstr.get(), (newstr.get() < 32 || newstr.get() >= 127)? ' ': String.fromCharCode(newstr.get()),
                //    len);
                p$1004 = new Ptr$752(null, null);
                var destIndex$1005 = newstr$995.getIndex() + len$998;
                for (newstr$995.cloneInto(p$1004); p$1004.getIndex() < destIndex$1005; p$1004.add(1)) {
                    outptr$1003.set(p$1004.get());
                    outptr$1003.add(1);
                }
            }
            /*-----------------------------------------------------------------------
            Add new leaf (first character of newstr) to tree as child of oldcode.
          -----------------------------------------------------------------------*/
            /* search for freecode */
            code$999 = lastfreecode$1002 + 1;
            while (/* add if-test before loop for speed? */
                code$999 < HSIZE$744 && parent$990[code$999] !== FREE_CODE$773) {
                ++code$999;
            }
            lastfreecode$1002 = code$999;
            if (// console.error("]; newcode %d\n", code);
                code$999 >= HSIZE$744) {
                /* invalid compressed data caused max-code overflow! */
                // console.log("code >= HSIZE");
                return 2;
            }
            /* ERR */
            Value$992[code$999] = finalval$996;
            parent$990[code$999] = oldcode$1000;
            oldcode$1000 = curcode$1001;
        }
        // console.log("OK");
        return 0;
    }
    function partial_clear$776(parent$1006, FLAG_BITS$1007, lastcodeused$1008) {
        var code$1009;
        for (/* clear all nodes which have no children (i.e., leaf nodes only) */
            /* first loop:  mark each parent as such */
            code$1009 = BOGUSCODE$771 + 1; code$1009 <= lastcodeused$1008; ++code$1009) {
            var cparent$1010 = parent$1006[code$1009] & CODE_MASK$772;
            if (cparent$1010 > BOGUSCODE$771) {
                FLAG_BITS$1007[cparent$1010] |= HAS_CHILD$774;
            }
        }
        for (/* second loop:  clear all nodes *not* marked as parents; reset flag bits */
            code$1009 = BOGUSCODE$771 + 1; code$1009 <= lastcodeused$1008; ++code$1009) {
            if (FLAG_BITS$1007[code$1009] & HAS_CHILD$774) {
                FLAG_BITS$1007[code$1009] &= ~HAS_CHILD$774;
            } else {
                // console.error("%d\n", code);
                parent$1006[code$1009] = FREE_CODE$773;
            }
        }
        return;
    }
    var unshrink$1$777 = function (compressedData$1011, output$1012, ucsize$1013) {
        if (ucsize$1013 === void 0)
            ucsize$1013 = output$1012.byteLength;
        var ws$1014 = get_work_struct_unshrink$747();
        var rv$1015 = unshrink$775(ws$1014, new ByteBuff$742(compressedData$1011), output$1012, ucsize$1013);
        release_work_struct_unshrink$748(ws$1014);
        return rv$1015;
    };
    var mask$778 = new Uint8Array([
        8,
        1,
        1,
        2,
        2,
        3,
        3,
        3,
        3,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        7,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8,
        8
    ]);
    function reduce_decompress_B$779(X$1016) {
        return mask$778[X$1016];
    }
    function reduce_decompress_L$780(X$1017, factor$1018) {
        return X$1017 & (1 << 8 - factor$1018) - 1;
    }
    function reduce_decompress_F$781(X$1019, factor$1020) {
        if (reduce_decompress_L$780(X$1019, factor$1020) === reduce_decompress_L$780(-1, factor$1020)) {
            return 2;
        }
        return 3;
    }
    function reduce_decompress_D$782(X$1021, Y$1022, factor$1023) {
        return (X$1021 >> 8 - factor$1023) * 256 + Y$1022 + 1;
    }
    var DLE$783 = 144;
    function reduce_decompress$784(inArr$1024, insz$1025, out$1026, outsz$1027, factor$1028) {
        var inBuff$1029 = new ByteBuff$742(inArr$1024);
        var o$1030 = new Ptr$752(out$1026, 0);
        var p$1031 = new Ptr$752(null, null);
        var i$1032, j$1033;
        var C$1034 = 0, V$1035 = 0, I$1036 = 0, Len$1037 = 0, State$1038 = 0, Last_Character$1039 = 0;
        var N$1040 = new Uint8Array(256), S$1041 = new Uint8Array(256 * 64);
        for (j$1033 = 255; j$1033 >= 0; j$1033--) {
            N$1040[j$1033] = inBuff$1029.readBits(6);
            for (i$1032 = 0; i$1032 < N$1040[j$1033]; i$1032++) {
                S$1041[j$1033 * 64 + i$1032] = inBuff$1029.readBits(8);
            }
        }
        while (!inBuff$1029.zipeof() && o$1030.getIndex() < outsz$1027) {
            if (N$1040[Last_Character$1039] === 0) {
                C$1034 = inBuff$1029.readBits(8);
            } else {
                if (inBuff$1029.readBits(1)) {
                    C$1034 = inBuff$1029.readBits(8);
                } else {
                    I$1036 = inBuff$1029.readBits(reduce_decompress_B$779(N$1040[Last_Character$1039]));
                    C$1034 = S$1041[64 * Last_Character$1039 + I$1036];
                }
            }
            Last_Character$1039 = C$1034;
            switch (State$1038) {
            case 0:
                if (C$1034 !== DLE$783) {
                    if (o$1030.getIndex() < outsz$1027) {
                        o$1030.set(C$1034);
                        o$1030.add(1);
                    }
                } else {
                    State$1038 = 1;
                }
                break;
            case 1:
                if (C$1034 !== 0) {
                    V$1035 = C$1034;
                    Len$1037 = reduce_decompress_L$780(V$1035, factor$1028);
                    State$1038 = reduce_decompress_F$781(Len$1037, factor$1028);
                } else {
                    if (o$1030.getIndex() < outsz$1027) {
                        o$1030.set(DLE$783);
                        o$1030.add(1);
                    }
                    State$1038 = 0;
                }
                break;
            case 2:
                Len$1037 += C$1034;
                State$1038 = 3;
                break;
            case 3:
                o$1030.addInto(p$1031, -(reduce_decompress_D$782(V$1035, C$1034, factor$1028) & 16383));
                for (// Winzip uses a 0x3fff mask here
                    i$1032 = 0; i$1032 < Len$1037 + 3; i$1032++, p$1031.add(1)) {
                    if (o$1030.getIndex() < outsz$1027) {
                        if (p$1031.getIndex() < 0) {
                            o$1030.set(0);
                            o$1030.add(1);
                        } else {
                            o$1030.set(p$1031.get());
                            o$1030.add(1);
                        }
                    }
                }
                State$1038 = 0;
                break;
            default:
                break;
            }
        }
        return o$1030.getIndex();
    }
    var ZipFS$785 = BrowserFS$740.FileSystem.ZipFS;
    var CompressionMethod$786 = ZipFS$785.CompressionMethod;
    var Buffer$787 = BrowserFS$740.BFSRequire('buffer').Buffer;
    var Errors$1$788 = BrowserFS$740.Errors;
    ZipFS$785.RegisterDecompressionMethod(CompressionMethod$786.IMPLODE, function (data$1042, compressedSize$1043, uncompressedSize$1044, flags$1045) {
        var output$1046 = new Buffer$787(uncompressedSize$1044);
        var success$1047 = explode$770(flags$1045, data$1042.subarray(0, compressedSize$1043), output$1046, uncompressedSize$1044);
        if (// Returns 5 when it reads one byte too many.
            // It's OK to ignore.
            success$1047 === 0 || success$1047 === 5) {
            return output$1046;
        } else {
            throw new Errors$1$788.ApiError(Errors$1$788.ErrorCode.EIO, 'Decompression failed.');
        }
    });
    ZipFS$785.RegisterDecompressionMethod(CompressionMethod$786.SHRUNK, function (data$1048, compressedSize$1049, uncompressedSize$1050) {
        var output$1051 = new Buffer$787(uncompressedSize$1050);
        var success$1052 = unshrink$1$777(data$1048.subarray(0, compressedSize$1049), output$1051, uncompressedSize$1050);
        if (success$1052 === 0) {
            return output$1051;
        } else {
            throw new Errors$1$788.ApiError(Errors$1$788.ErrorCode.EIO, 'Decompression failed.');
        }
    });
    function unreduceMethod$789(data$1053, compressedSize$1054, uncompressedSize$1055, level$1056) {
        var output$1057 = new Buffer$787(uncompressedSize$1055);
        var success$1058 = reduce_decompress$784(data$1053.subarray(0, compressedSize$1054), compressedSize$1054, output$1057, uncompressedSize$1055, level$1056);
        if (success$1058 === uncompressedSize$1055) {
            return output$1057;
        } else {
            throw new Errors$1$788.ApiError(Errors$1$788.ErrorCode.EIO, 'Decompression failed.');
        }
    }
    ZipFS$785.RegisterDecompressionMethod(CompressionMethod$786.REDUCED_1, function (d$1059, c$1060, u$1061) {
        return unreduceMethod$789(d$1059, c$1060, u$1061, 1);
    });
    ZipFS$785.RegisterDecompressionMethod(CompressionMethod$786.REDUCED_2, function (d$1062, c$1063, u$1064) {
        return unreduceMethod$789(d$1062, c$1063, u$1064, 2);
    });
    ZipFS$785.RegisterDecompressionMethod(CompressionMethod$786.REDUCED_3, function (d$1065, c$1066, u$1067) {
        return unreduceMethod$789(d$1065, c$1066, u$1067, 3);
    });
    ZipFS$785.RegisterDecompressionMethod(CompressionMethod$786.REDUCED_4, function (d$1068, c$1069, u$1070) {
        return unreduceMethod$789(d$1068, c$1069, u$1070, 4);
    });
}(BrowserFS));
//# sourceMappingURL=browserfs-zipfs-extras.js.map